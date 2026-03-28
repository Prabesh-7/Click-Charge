# from sqlalchemy.ext.asyncio import AsyncSession
# from app.models.user import User
# from app.schemas.userValidation import UserCreate
# from sqlalchemy.ext.asyncio import AsyncSession
# from sqlalchemy.future import select
# from fastapi import HTTPException
# from app.schemas.userValidation import UserLogin, Token
# # from app.utils.security import verify_password
# from app.utils.jwt import create_access_token
# # from app.utils.security import hash_password




# from app.schemas.userValidation import UserLogin

# from app.utils.jwt import create_access_token
# from app.schemas.userValidation import TokenData


# async def login_user(user: UserLogin, db: AsyncSession):

#     result = await db.execute(
#         select(User).where(User.email == user.email)
#     )

#     db_user = result.scalar_one_or_none()

#     # if not db_user:
#     #     raise HTTPException(status_code=401, detail="Invalid email or password")

#     # if not verify_password(user.password, db_user.password):
#     #     raise HTTPException(status_code=401, detail="Invalid email or password")
    
#     if not db_user or db_user.password != user.password:
#         raise HTTPException(status_code=401, detail="Invalid email or password")

#     token_data = TokenData(
#         user_id=db_user.user_id,
#         email=db_user.email,
#         role=db_user.role
#     )

#     access_token = create_access_token(token_data)

#     return {
#     "access_token": access_token,
#     "token_type": "bearer",
#     "user": {
#         "user_id": db_user.user_id,
#         "email": db_user.email,
#         "role": db_user.role,
#         "user": UserOut.model_validate(db_user),
#         "created_at": db_user.created_at,      # ← add this
#         "phone_number": db_user.phone_number,  # ← add optional fields too
#         "vehicle": db_user.vehicle,
#     }
# }


# async def register_user(user: UserCreate, db: AsyncSession):

#     # check if email already exists
#     result = await db.execute(
#         select(User).where(User.email == user.email)
#         )
#     existing_user = result.scalar_one_or_none()

#     if existing_user:
#         raise HTTPException(status_code=400, detail="Email already registered")

#     new_user = User(
#         user_name=user.user_name,
#         email=user.email,
#         password=user.password,
#         phone_number=user.phone_number,
#         vehicle=user.vehicle
#     )

#     db.add(new_user)
#     await db.commit()
#     await db.refresh(new_user)

#     return new_user


from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.stations import Station
from app.models.chargers import Charger, ChargerStatus
from app.schemas.userValidation import UserCreate, UserOut
from sqlalchemy.future import select
from sqlalchemy import func, case, cast, String
from fastapi import HTTPException
from app.schemas.userValidation import UserLogin, Token
from app.utils.jwt import create_access_token
from app.schemas.userValidation import TokenData
from app.schemas.user_station import UserStationOut


async def login_user(user: UserLogin, db: AsyncSession):

    result = await db.execute(
        select(User).where(User.email == user.email)
    )
    db_user = result.scalar_one_or_none()
    


    if not db_user or db_user.password != user.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token_data = TokenData(
        user_id=db_user.user_id,
        email=db_user.email,
        role=db_user.role
    )

    access_token = create_access_token(token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserOut.model_validate(db_user)  # ← clean, single line
    }


async def register_user(user: UserCreate, db: AsyncSession):

    result = await db.execute(
        select(User).where(User.email == user.email)
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        user_name=user.user_name,
        email=user.email,
        password=user.password,
        phone_number=user.phone_number,
        vehicle=user.vehicle
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


async def get_available_stations_for_user(db: AsyncSession) -> list[UserStationOut]:
    result = await db.execute(
        select(
            Station.station_id,
            Station.station_name,
            Station.address,
            func.ST_X(Station.location).label("longitude"),
            func.ST_Y(Station.location).label("latitude"),
            Station.station_description,
            Station.phone_number,
            Station.has_wifi,
            Station.has_parking,
            Station.has_food,
            Station.has_coffee,
            Station.has_bedroom,
            Station.has_restroom,
            Station.station_images,
            func.count(Charger.charger_id).label("total_chargers"),
            func.coalesce(
                func.sum(
                    case(
                        (Charger.status == ChargerStatus.AVAILABLE, 1),
                        else_=0,
                    )
                ),
                0,
            ).label("available_chargers"),
            func.array_remove(
                func.array_agg(func.distinct(cast(Charger.type, String))),
                None,
            ).label("charger_types"),
            Station.created_at,
        )
        .outerjoin(Charger, Charger.station_id == Station.station_id)
        .group_by(
            Station.station_id,
            Station.station_name,
            Station.address,
            Station.location,
            Station.station_description,
            Station.phone_number,
            Station.has_wifi,
            Station.has_parking,
            Station.has_food,
            Station.has_coffee,
            Station.has_bedroom,
            Station.has_restroom,
            Station.station_images,
            Station.created_at,
        )
        .order_by(Station.created_at.desc())
    )

    stations = result.mappings().all()

    return [UserStationOut.model_validate(station) for station in stations]