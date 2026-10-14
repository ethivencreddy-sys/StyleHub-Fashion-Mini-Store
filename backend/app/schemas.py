from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    is_admin: bool

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    price: float
    category: str
    image_url: str | None = None
    stock: int = 0


class ProductResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    price: float
    category: str
    image_url: str | None = None
    stock: int

    class Config:
        from_attributes = True



class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = 1


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    quantity: int

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    user_id: int


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price_at_purchase: float

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    user_id: int
    total_amount: float
    status: str
    payment_status: str

    class Config:
        from_attributes = True
