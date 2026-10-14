
import os

import stripe
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Order, User

load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)


class PaymentRequest(BaseModel):
    order_id: int


def get_owned_order(
    order_id: int,
    db: Session,
    current_user: User,
) -> Order:
    order = (
        db.query(Order)
        .filter(
            Order.id == order_id,
            Order.user_id == current_user.id,
        )
        .first()
    )

    if order is None:
        # Do not reveal whether another user's order exists.
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    return order


@router.post("/create-payment-intent")
def create_payment_intent(
    payment: PaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not stripe.api_key:
        raise HTTPException(
            status_code=500,
            detail="Stripe secret key is not configured",
        )

    order = get_owned_order(
        payment.order_id,
        db,
        current_user,
    )

    if order.payment_status == "Paid":
        raise HTTPException(
            status_code=400,
            detail="Order has already been paid",
        )

    if order.total_amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Order amount must be greater than zero",
        )

    try:
        # Reuse an existing payment intent when possible.
        if order.stripe_payment_intent_id:
            intent = stripe.PaymentIntent.retrieve(
                order.stripe_payment_intent_id
            )

            if intent.status == "succeeded":
                order.payment_status = "Paid"
                order.status = "Confirmed"
                db.commit()

                raise HTTPException(
                    status_code=400,
                    detail="Order has already been paid",
                )

            if intent.status not in (
                "canceled",
                "succeeded",
            ):
                return {
                    "order_id": order.id,
                    "client_secret": intent.client_secret,
                    "payment_intent_id": intent.id,
                    "amount": order.total_amount,
                    "currency": "inr",
                }

        # Stripe expects INR amounts in the smallest currency unit.
        intent = stripe.PaymentIntent.create(
            amount=int(round(order.total_amount * 100)),
            currency="inr",
            metadata={
                "order_id": str(order.id),
                "user_id": str(current_user.id),
            },
        )

        order.stripe_payment_intent_id = intent.id
        db.commit()

        return {
            "order_id": order.id,
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id,
            "amount": order.total_amount,
            "currency": "inr",
        }

    except HTTPException:
        raise
    except stripe.StripeError:
        raise HTTPException(
            status_code=502,
            detail="Unable to create payment with Stripe",
        )


@router.get("/status/{order_id}")
def check_payment_status(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = get_owned_order(
        order_id,
        db,
        current_user,
    )

    if not stripe.api_key:
        raise HTTPException(
            status_code=500,
            detail="Stripe secret key is not configured",
        )

    if not order.stripe_payment_intent_id:
        return {
            "order_id": order.id,
            "payment_intent_status": None,
            "payment_status": order.payment_status,
            "order_status": order.status,
            "message": "No payment has been initiated",
        }

    try:
        intent = stripe.PaymentIntent.retrieve(
            order.stripe_payment_intent_id
        )

        if intent.status == "succeeded":
            order.payment_status = "Paid"
            order.status = "Confirmed"

        elif intent.status == "canceled":
            order.payment_status = "Failed"

        elif intent.status in (
            "requires_payment_method",
            "requires_confirmation",
            "requires_action",
            "processing",
        ):
            order.payment_status = "Pending"

        db.commit()

        return {
            "order_id": order.id,
            "payment_intent_status": intent.status,
            "payment_status": order.payment_status,
            "order_status": order.status,
        }

    except stripe.StripeError:
        raise HTTPException(
            status_code=502,
            detail="Unable to retrieve payment status from Stripe",
        )
