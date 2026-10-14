
import { useState } from 'react'
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const API_URL = 'http://127.0.0.1:8000'

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
)

const buttonStyle = {
  width: '100%',
  padding: '14px 18px',
  border: 'none',
  background: '#283a2d',
  color: '#ffffff',
  fontSize: 14,
  cursor: 'pointer',
}

const secondaryButtonStyle = {
  ...buttonStyle,
  marginTop: 12,
  background: '#ffffff',
  color: '#25251f',
  border: '1px solid #d8d5ce',
}

function authHeaders(token, includeJson = false) {
  return {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${token}`,
  }
}

function PaymentForm({ orderId, amount, token, onBack }) {
  const stripe = useStripe()
  const elements = useElements()

  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const [verifiedOrder, setVerifiedOrder] = useState(null)

  async function verifyPayment() {
    const response = await fetch(
      `${API_URL}/payments/status/${orderId}`,
      {
        headers: authHeaders(token),
      }
    )

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.detail || 'Unable to verify payment.')
    }

    if (
      data.payment_intent_status === 'succeeded' &&
      data.payment_status === 'Paid' &&
      data.order_status === 'Confirmed'
    ) {
      setVerifiedOrder(data)
      setMessage('')
      return
    }

    setMessage(
      `Payment is not confirmed yet. Current status: ${data.payment_status || 'Pending'}.`
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!stripe || !elements || processing) return

    setProcessing(true)
    setMessage('')

    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })

      if (result.error) {
        setMessage(
          result.error.message || 'Payment could not be completed.'
        )
        return
      }

      if (result.paymentIntent?.status === 'succeeded') {
        await verifyPayment()
      } else {
        setMessage(
          `Payment status: ${result.paymentIntent?.status || 'Processing'}. Please verify again shortly.`
        )
      }
    } catch (error) {
      setMessage(
        error.message || 'Unable to verify the payment at this time.'
      )
    } finally {
      setProcessing(false)
    }
  }

  if (verifiedOrder) {
    return (
      <section
        style={{
          maxWidth: 560,
          margin: '0 auto',
          padding: '30px 0',
          textAlign: 'center',
          color: '#25251f',
        }}
      >
        <div
          style={{
            width: 70,
            height: 70,
            margin: '0 auto 24px',
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: '#e6f2e7',
            color: '#28623a',
            fontSize: 34,
          }}
        >
          ✓
        </div>

        <p className="eyebrow">ORDER CONFIRMED</p>

        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 42,
            fontWeight: 500,
            color: '#283a2d',
          }}
        >
          Thank you for your order.
        </h2>

        <p style={{ color: '#74736c', lineHeight: 1.8 }}>
          Your payment has been verified successfully.
        </p>

        <div
          style={{
            margin: '28px 0',
            padding: 24,
            textAlign: 'left',
            border: '1px solid #e9e6df',
            background: '#ffffff',
          }}
        >
          <p>
            Order number: <strong>#{verifiedOrder.order_id}</strong>
          </p>
          <p>
            Amount paid:{' '}
            <strong>₹{Number(amount).toLocaleString('en-IN')}</strong>
          </p>
          <p>
            Payment status: <strong>{verifiedOrder.payment_status}</strong>
          </p>
          <p>
            Order status: <strong>{verifiedOrder.order_status}</strong>
          </p>
        </div>

        <button type="button" onClick={onBack} style={buttonStyle}>
          Continue shopping
        </button>
      </section>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 520, margin: '0 auto' }}>
      <p className="eyebrow">SECURE CHECKOUT</p>

      <h2 style={{ color: '#25251f', fontSize: 36 }}>
        Complete your <em style={{ color: '#a47754' }}>order.</em>
      </h2>

      <p style={{ color: '#626258' }}>Order #{orderId}</p>

      <h3 style={{ color: '#25251f' }}>
        Amount: ₹{Number(amount).toLocaleString('en-IN')}
      </h3>

      <div
        style={{
          padding: 20,
          margin: '24px 0',
          border: '1px solid #e9e6df',
          background: '#ffffff',
        }}
      >
        <PaymentElement />
      </div>

      {message && (
        <p
          role="status"
          style={{
            padding: 12,
            color: '#7b3329',
            background: '#fff0ed',
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || processing}
        style={buttonStyle}
      >
        {processing
          ? 'Verifying payment...'
          : `Pay ₹${Number(amount).toLocaleString('en-IN')}`}
      </button>

      <button
        type="button"
        onClick={onBack}
        style={secondaryButtonStyle}
      >
        Back to shopping bag
      </button>
    </form>
  )
}

export default function Checkout({ orderId, token, onBack }) {
  const [paymentData, setPaymentData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function createPaymentIntent() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `${API_URL}/payments/create-payment-intent`,
        {
          method: 'POST',
          headers: authHeaders(token, true),
          body: JSON.stringify({ order_id: orderId }),
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.detail || 'Unable to start payment.')
      }

      if (!data.client_secret) {
        throw new Error('The backend did not return a payment client secret.')
      }

      setPaymentData(data)
    } catch (error) {
      setError(error.message || 'Unable to start payment.')
    } finally {
      setLoading(false)
    }
  }

  if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
    return (
      <section style={{ padding: '50px 7%', minHeight: 400 }}>
        <h2 style={{ color: '#25251f' }}>Stripe key missing</h2>
        <p style={{ color: '#626258' }}>
          Check frontend/.env for your test publishable key.
        </p>
        <button onClick={onBack} style={secondaryButtonStyle}>
          Back to shopping bag
        </button>
      </section>
    )
  }

  return (
    <section
      style={{
        padding: '50px 7%',
        minHeight: 450,
        background: '#fbfaf7',
      }}
    >
      {!paymentData ? (
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <p className="eyebrow">STYLEHUB CHECKOUT</p>
          <h2 style={{ color: '#25251f', fontSize: 40 }}>Checkout.</h2>
          <p style={{ color: '#626258' }}>Order #{orderId}</p>
          <p style={{ color: '#626258', lineHeight: 1.8 }}>
            Prepare your secure Stripe test payment to continue.
          </p>

          {error && (
            <p role="alert" style={{ color: '#9b3028' }}>
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={createPaymentIntent}
            disabled={loading}
            style={buttonStyle}
          >
            {loading ? 'Preparing payment...' : 'Continue to payment'}
          </button>

          <button
            type="button"
            onClick={onBack}
            style={secondaryButtonStyle}
          >
            Back
          </button>
        </div>
      ) : (
        <Elements
          stripe={stripePromise}
          options={{ clientSecret: paymentData.client_secret }}
        >
          <PaymentForm
            orderId={paymentData.order_id}
            amount={paymentData.amount}
            token={token}
            onBack={onBack}
          />
        </Elements>
      )}
    </section>
  )
}
