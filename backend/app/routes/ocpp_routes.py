import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.ocpp_service import ocpp_simulator


router = APIRouter(prefix="/ocpp", tags=["OCPP Simulator"])


@router.websocket("/ws/{charge_point_id}")
async def ocpp_websocket_endpoint(websocket: WebSocket, charge_point_id: str):
    await ocpp_simulator.connect(charge_point_id, websocket)

    try:
        while True:
            message = await websocket.receive_text()
            response = await ocpp_simulator.handle_message(charge_point_id, message)
            await websocket.send_text(json.dumps(response))
    except WebSocketDisconnect:
        ocpp_simulator.disconnect(charge_point_id)