# StyleHub – Fashion Mini Store

## Project Overview

StyleHub is a full-stack fashion e-commerce application that allows users to register, log in, browse fashion products, add products to their shopping cart, place orders, and make test payments using Stripe.

The project demonstrates full-stack development using FastAPI, React, SQLite, JWT authentication, and Stripe payment integration.

## Technologies Used

### Backend
- Python
- FastAPI
- SQLAlchemy
- SQLite
- Pydantic
- JWT Authentication
- bcrypt password hashing
- Stripe Payment Integration

### Frontend
- React
- Vite
- JavaScript
- HTML
- CSS

## Features

- User registration and login
- JWT-based authentication
- Product listing and product management
- Product search and category filtering
- Shopping cart management
- Quantity and cart total calculation
- Order creation and order history
- Stripe test-mode payment integration
- Payment and order status checking
- API documentation using Swagger UI

## Project Structure

```text
StyleHub/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── auth.py
│   │   ├── dependencies.py
│   │   └── routers/
│   ├── requirements.txt
│   ├── .env
│   └── stylehub.db
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── Auth.jsx
│   │   └── Checkout.jsx
│   ├── package.json
│   └── package-lock.json
├── screenshots/
└── README.md
```

*Note: The structure above is representative. Your actual project may contain additional files.*

## Prerequisites

Install the following before running the project:

- Python 3.10 or later
- Node.js and npm
- Visual Studio Code
- Stripe test-mode account and API keys

## Backend Setup

1. Open a terminal in the project directory.
2. Navigate to the backend folder:

```powershell
cd backend
```

3. Create and activate a virtual environment if one does not already exist:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

4. Install the required Python packages:

```powershell
pip install -r requirements.txt
```

5. Configure the required environment variables in a local `.env` file. Use your own secret values and never commit them to version control.

6. Start the FastAPI server:

```powershell
uvicorn app.main:app --reload
```

The backend will be available at:

http://127.0.0.1:8000

## API Documentation

After starting the backend, open:

http://127.0.0.1:8000/docs

Swagger UI provides interactive documentation for testing the API endpoints.

## Frontend Setup

1. Open a second terminal.
2. Navigate to the frontend folder:

```powershell
cd frontend
```

3. Install the frontend dependencies:

```powershell
npm install
```

4. Start the React development server:

```powershell
npm run dev
```

Open the Local URL displayed in the terminal, usually:

http://localhost:5173

Keep both the backend and frontend servers running while using the application.

## Main API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Register a user |
| POST | `/auth/login` | Log in |
| GET | `/products/` | View products |
| GET | `/products/{id}` | View a product |
| POST | `/cart/` | Add an item to the cart |
| GET | `/cart/` | View the cart |
| GET | `/cart/total` | Calculate the cart total |
| DELETE | `/cart/{item_id}` | Remove a cart item |
| POST | `/orders/` | Create an order |
| GET | `/orders/` | View orders |
| POST | `/payments/create-payment-intent` | Create a Stripe PaymentIntent |
| GET | `/payments/status/{order_id}` | Check payment status |

Refer to Swagger UI for the exact request formats and parameters supported by each endpoint.

## Database

StyleHub uses SQLite to store application data. SQLAlchemy is used for database operations.

The database file is named `stylehub.db` and is located in the backend directory.

## Payment Integration

Stripe is integrated in test mode to demonstrate payment processing without using real payments.

Use Stripe's official test card details only in test mode. Never include secret API keys in screenshots, source control, or the submission ZIP.

## Screenshots

The `screenshots` folder contains screenshots demonstrating the application interface, product search and filtering, shopping cart, API documentation, and successful order confirmation.

## Running the Project

1. Start the FastAPI backend.
2. Start the React frontend in a separate terminal.
3. Open the frontend URL in your browser.
4. Register or log in.
5. Browse products and add items to the cart.
6. Proceed to checkout and test the payment flow.

## Project Status

The core backend APIs, React frontend, shopping cart, order processing, and Stripe test-payment flow have been implemented and tested.

## Author

StyleHub – Fashion Mini Store

Developed as a full-stack learning project using FastAPI and React.


## Admin Login

The application supports administrator access for managing products.

- **Admin Email:**ethivencreddy@gmail.com
- **Admin Password:** *sunny*E12
### Admin Capabilities
- Create products
- Update product details
- Delete products
- Manage product listings

**Note:** Replace the placeholder email with your actual admin account email. Share demo credentials with your trainer privately, and never include Stripe secret keys or other application secrets.