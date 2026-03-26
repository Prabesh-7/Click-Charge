import json
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import WebSocket


class OCPPSimulatorService:
    def __init__(self):
        self.connections: dict[str, WebSocket] = {}
        self.live_meter_values: dict[str, dict[str, Any]] = {}
        self.active_transactions: dict[str, int] = {}
        self._next_transaction_id = 1

    async def connect(self, charge_point_id: str, websocket: WebSocket):
        await websocket.accept(subprotocol="ocpp1.6")
        self.connections[charge_point_id] = websocket

    def disconnect(self, charge_point_id: str):
        self.connections.pop(charge_point_id, None)

    async def handle_message(self, charge_point_id: str, message: str):
        try:
            payload = json.loads(message)
        except Exception:
            return [4, "unknown", "FormatViolation", "Invalid JSON payload", {}]

        if not isinstance(payload, list) or len(payload) < 4:
            return [4, "unknown", "ProtocolError", "Invalid OCPP frame", {}]

        message_type = payload[0]
        unique_id = payload[1]

        if message_type != 2:
            return [4, unique_id, "ProtocolError", "Only CALL frames are supported", {}]

        action = payload[2]
        data = payload[3] if isinstance(payload[3], dict) else {}

        if action == "BootNotification":
            return [
                3,
                unique_id,
                {
                    "status": "Accepted",
                    "currentTime": datetime.now(tz=timezone.utc).isoformat(),
                    "interval": 10,
                },
            ]

        if action == "Heartbeat":
            return [3, unique_id, {"currentTime": datetime.now(tz=timezone.utc).isoformat()}]

        if action == "Authorize":
            return [3, unique_id, {"idTagInfo": {"status": "Accepted"}}]

        if action == "StatusNotification":
            status = data.get("status", "Available")
            previous = self.live_meter_values.get(charge_point_id, {})
            self.live_meter_values[charge_point_id] = {
                **previous,
                "status": status,
                "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            }
            return [3, unique_id, {}]

        if action == "StartTransaction":
            transaction_id = self._next_transaction_id
            self._next_transaction_id += 1
            self.active_transactions[charge_point_id] = transaction_id

            previous = self.live_meter_values.get(charge_point_id, {})
            self.live_meter_values[charge_point_id] = {
                **previous,
                "status": "Charging",
                "transaction_id": transaction_id,
                "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            }

            return [
                3,
                unique_id,
                {
                    "idTagInfo": {"status": "Accepted"},
                    "transactionId": transaction_id,
                },
            ]

        if action == "MeterValues":
            parsed = self._parse_meter_values(data)
            previous = self.live_meter_values.get(charge_point_id, {})
            self.live_meter_values[charge_point_id] = {
                **previous,
                **parsed,
                "status": previous.get("status", "Charging"),
                "transaction_id": data.get("transactionId") or self.active_transactions.get(charge_point_id),
                "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            }
            return [3, unique_id, {}]

        if action == "StopTransaction":
            self.active_transactions.pop(charge_point_id, None)
            previous = self.live_meter_values.get(charge_point_id, {})
            self.live_meter_values[charge_point_id] = {
                **previous,
                "status": "Available",
                "transaction_id": None,
                "power_kw": 0.0,
                "current_a": 0.0,
                "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            }
            return [3, unique_id, {"idTagInfo": {"status": "Accepted"}}]

        return [4, unique_id, "NotImplemented", f"Action {action} not supported", {}]

    def get_meter_values(self, charge_point_id: str) -> Optional[dict[str, Any]]:
        return self.live_meter_values.get(charge_point_id)

    def _parse_meter_values(self, data: dict[str, Any]) -> dict[str, Any]:
        meter_values = data.get("meterValue") or []

        power_kw = 0.0
        reactive_power_kvar = 0.0
        voltage_v = 0.0
        current_a = 0.0
        power_factor = 1.0
        frequency_hz = 50.0
        energy_kwh = 0.0
        reactive_energy_kvarh = 0.0
        temperature_c = 0.0
        soc_percent = 0.0

        if not meter_values:
            return {
                "power_kw": power_kw,
                "reactive_power_kvar": reactive_power_kvar,
                "voltage_v": voltage_v,
                "current_a": current_a,
                "power_factor": power_factor,
                "frequency_hz": frequency_hz,
                "energy_kwh": energy_kwh,
                "reactive_energy_kvarh": reactive_energy_kvarh,
                "temperature_c": temperature_c,
                "soc_percent": soc_percent,
            }

        sampled = meter_values[-1].get("sampledValue") or []

        for item in sampled:
            measurand = item.get("measurand", "")
            value_raw = item.get("value")

            try:
                value = float(value_raw)
            except Exception:
                continue

            if measurand == "Power.Active.Import":
                power_kw = round(value / 1000.0, 3)
            elif measurand == "Power.Reactive.Import":
                reactive_power_kvar = round(value / 1000.0, 3)
            elif measurand == "Voltage":
                voltage_v = round(value, 3)
            elif measurand == "Current.Import":
                current_a = round(value, 3)
            elif measurand == "Power.Factor":
                power_factor = round(value, 3)
            elif measurand == "Frequency":
                frequency_hz = round(value, 3)
            elif measurand == "Energy.Active.Import.Register":
                energy_kwh = round(value / 1000.0, 3)
            elif measurand == "Energy.Reactive.Import.Register":
                reactive_energy_kvarh = round(value / 1000.0, 3)
            elif measurand == "Temperature":
                temperature_c = round(value, 3)
            elif measurand in ["SoC", "SOC"]:
                soc_percent = round(value, 3)

        return {
            "power_kw": power_kw,
            "reactive_power_kvar": reactive_power_kvar,
            "voltage_v": voltage_v,
            "current_a": current_a,
            "power_factor": power_factor,
            "frequency_hz": frequency_hz,
            "energy_kwh": energy_kwh,
            "reactive_energy_kvarh": reactive_energy_kvarh,
            "temperature_c": temperature_c,
            "soc_percent": soc_percent,
        }


ocpp_simulator = OCPPSimulatorService()