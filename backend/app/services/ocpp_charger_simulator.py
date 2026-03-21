import argparse
import asyncio
import json
import random
from datetime import datetime, timezone

import websockets


def make_call(unique_id: str, action: str, payload: dict):
    return [2, unique_id, action, payload]


async def send_call(ws, unique_id: str, action: str, payload: dict):
    message = make_call(unique_id, action, payload)
    await ws.send(json.dumps(message))
    response = await ws.recv()
    print(f"<- {response}")
    return json.loads(response)


async def run_simulator(base_url: str, charge_point_id: str, duration_seconds: int, max_power_kw: int):
    ws_url = f"{base_url.rstrip('/')}/ocpp/ws/{charge_point_id}"
    print(f"Connecting to {ws_url}")

    async with websockets.connect(ws_url, subprotocols=["ocpp1.6"]) as ws:
        # BootNotification
        print("-> BootNotification")
        await send_call(
            ws,
            "boot-1",
            "BootNotification",
            {
                "chargePointVendor": "ClickAndCharge",
                "chargePointModel": "Simulator-v1",
            },
        )

        # Authorize
        print("-> Authorize")
        await send_call(ws, "auth-1", "Authorize", {"idTag": "SIM_USER_001"})

        # StartTransaction
        print("-> StartTransaction")
        start_response = await send_call(
            ws,
            "start-1",
            "StartTransaction",
            {
                "connectorId": 1,
                "idTag": "SIM_USER_001",
                "meterStart": 0,
                "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            },
        )

        transaction_id = None
        if isinstance(start_response, list) and len(start_response) >= 3:
            transaction_id = start_response[2].get("transactionId")

        energy_wh = 0.0
        elapsed = 0

        while elapsed < duration_seconds:
            power_kw = round(random.uniform(max_power_kw * 0.6, max_power_kw), 2)
            voltage_v = 400.0
            current_a = round((power_kw * 1000) / voltage_v, 2)

            energy_wh += power_kw * (1000 / 3600)

            print("-> MeterValues")
            await send_call(
                ws,
                f"meter-{elapsed}",
                "MeterValues",
                {
                    "connectorId": 1,
                    "transactionId": transaction_id,
                    "meterValue": [
                        {
                            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
                            "sampledValue": [
                                {"value": str(power_kw * 1000), "measurand": "Power.Active.Import"},
                                {"value": str(voltage_v), "measurand": "Voltage"},
                                {"value": str(current_a), "measurand": "Current.Import"},
                                {
                                    "value": str(round(energy_wh, 3)),
                                    "measurand": "Energy.Active.Import.Register",
                                },
                            ],
                        }
                    ],
                },
            )

            elapsed += 1
            await asyncio.sleep(1)

        # StopTransaction
        print("-> StopTransaction")
        await send_call(
            ws,
            "stop-1",
            "StopTransaction",
            {
                "transactionId": transaction_id,
                "meterStop": int(energy_wh),
                "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            },
        )


def main():
    parser = argparse.ArgumentParser(description="Simple OCPP charger simulator")
    parser.add_argument("--url", default="ws://127.0.0.1:8000", help="Backend websocket base URL")
    parser.add_argument("--cpid", required=True, help="Charge point id")
    parser.add_argument("--duration", type=int, default=20, help="Charging duration in seconds")
    parser.add_argument("--max-power", type=int, default=50, help="Max power kW")
    args = parser.parse_args()

    asyncio.run(
        run_simulator(
            base_url=args.url,
            charge_point_id=args.cpid,
            duration_seconds=args.duration,
            max_power_kw=args.max_power,
        )
    )


if __name__ == "__main__":
    main()