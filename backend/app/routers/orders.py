from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models import CartItem, Order, OrderItem, Product, User
from app.schemas import OrderResponse

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)


@router.post(
    "/",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED
)
def create_order(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart_items = db.query(CartItem).filter(
        CartItem.user_id == current_user.id
    ).all()

    if not cart_items:
        raise HTTPException(
            status_code=400,
            detail="Cart is empty"
        )

    total_amount = 0.0
    order_items_data = []

    for item in cart_items:
        product = db.query(Product).filter(
            Product.id == item.product_id
        ).first()

        if product is None:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        if item.quantity > product.stock:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product.name}"
            )

        total_amount += product.price * item.quantity

        order_items_data.append({
            "product_id": product.id,
            "quantity": item.quantity,
            "price_at_purchase": product.price
        })

    new_order = Order(
        user_id=current_user.id,
        total_amount=round(total_amount, 2),
        status="Pending",
        payment_status="Pending"
    )

    db.add(new_order)
    db.flush()

    for item_data in order_items_data:
        db.add(
            OrderItem(
                order_id=new_order.id,
                **item_data
            )
        )

    for item in cart_items:
        product = db.query(Product).filter(
            Product.id == item.product_id
        ).first()

        product.stock -= item.quantity
        db.delete(item)

    db.commit()
    db.refresh(new_order)

    return new_order


@router.get("/", response_model=list[OrderResponse])
def get_user_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Order).filter(
        Order.user_id == current_user.id
    ).order_by(
        Order.created_at.desc()
    ).all()
