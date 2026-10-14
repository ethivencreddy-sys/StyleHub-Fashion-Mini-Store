

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import CartItem, Product, User
from app.schemas import (
    CartItemCreate,
    CartItemUpdate,
    CartItemResponse,
)

router = APIRouter(
    prefix="/cart",
    tags=["Shopping Cart"]
)


@router.post("/", response_model=CartItemResponse)
def add_to_cart(
    item: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(
        Product.id == item.product_id
    ).first()

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if item.quantity < 1:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be at least 1"
        )

    cart_item = db.query(CartItem).filter(
        CartItem.user_id == current_user.id,
        CartItem.product_id == item.product_id
    ).first()

    existing_quantity = cart_item.quantity if cart_item else 0

    if existing_quantity + item.quantity > product.stock:
        raise HTTPException(
            status_code=400,
            detail="Insufficient stock"
        )

    if cart_item:
        cart_item.quantity += item.quantity
    else:
        cart_item = CartItem(
            user_id=current_user.id,
            product_id=item.product_id,
            quantity=item.quantity
        )
        db.add(cart_item)

    db.commit()
    db.refresh(cart_item)
    return cart_item


@router.get("/", response_model=list[CartItemResponse])
def view_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(CartItem).filter(
        CartItem.user_id == current_user.id
    ).all()


@router.put("/{item_id}", response_model=CartItemResponse)
def update_cart_item(
    item_id: int,
    item: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if item.quantity < 1:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be at least 1"
        )

    cart_item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.user_id == current_user.id
    ).first()

    if cart_item is None:
        raise HTTPException(
            status_code=404,
            detail="Cart item not found"
        )

    product = db.query(Product).filter(
        Product.id == cart_item.product_id
    ).first()

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if item.quantity > product.stock:
        raise HTTPException(
            status_code=400,
            detail="Insufficient stock"
        )

    cart_item.quantity = item.quantity
    db.commit()
    db.refresh(cart_item)
    return cart_item


@router.delete("/{item_id}")
def remove_from_cart(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart_item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.user_id == current_user.id
    ).first()

    if cart_item is None:
        raise HTTPException(
            status_code=404,
            detail="Cart item not found"
        )

    db.delete(cart_item)
    db.commit()

    return {"message": "Cart item removed successfully"}


@router.get("/total")
def get_cart_total(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart_items = db.query(CartItem).filter(
        CartItem.user_id == current_user.id
    ).all()

    total = 0.0

    for item in cart_items:
        product = db.query(Product).filter(
            Product.id == item.product_id
        ).first()

        if product:
            total += product.price * item.quantity

    return {
        "user_id": current_user.id,
        "total_items": sum(
            item.quantity for item in cart_items
        ),
        "total_price": round(total, 2)
    }
