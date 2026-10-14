
import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import Auth from './Auth'
import Checkout from './Checkout'

const API_URL = 'http://127.0.0.1:8000'

const fallbackProducts = [
  {
    id: 1,
    name: 'Classic T-Shirt',
    description: 'A comfortable everyday cotton T-shirt.',
    category: 'Clothing',
    price: 599,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80',
    tag: 'BESTSELLER',
  },
  {
    id: 2,
    name: 'Essential White T-Shirt',
    description: 'Soft cotton crew-neck T-shirt for everyday wear.',
    category: 'Clothing',
    price: 499,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80',
    tag: 'ESSENTIAL',
  },
  {
    id: 3,
    name: 'Everyday Hoodie',
    description: 'Comfortable fleece hoodie for everyday casual wear.',
    category: 'Clothing',
    price: 1299,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=700&q=80',
    tag: 'NEW',
  },
  {
    id: 4,
    name: 'Classic Denim Jeans',
    description: 'Regular-fit blue denim jeans designed for everyday comfort.',
    category: 'Clothing',
    price: 1499,
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=700&q=80',
    tag: '',
  },
  {
    id: 5,
    name: 'Urban Sneakers',
    description: 'Lightweight sneakers with a comfortable cushioned sole.',
    category: 'Footwear',
    price: 1799,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80',
    tag: 'POPULAR',
  },
  {
    id: 6,
    name: 'Everyday Crossbody Bag',
    description: 'A compact crossbody bag for daily essentials.',
    category: 'Accessories',
    price: 899,
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=700&q=80',
    tag: '',
  },
]

function formatPrice(price) {
  return `₹${Number(price || 0).toLocaleString('en-IN')}`
}

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem('stylehub_token') || ''
  )
  const [email, setEmail] = useState(
    () => localStorage.getItem('stylehub_email') || ''
  )

  const [apiProducts, setApiProducts] = useState([])
  const [cartItems, setCartItems] = useState([])
  const [cartTotal, setCartTotal] = useState({
    total_items: 0,
    total_price: 0,
  })

  const [loading, setLoading] = useState(true)
  const [cartLoading, setCartLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [cartMessage, setCartMessage] = useState('')
  const [addingProductId, setAddingProductId] = useState(null)

  const [showCart, setShowCart] = useState(false)
  const [checkoutOrderId, setCheckoutOrderId] = useState(null)
  const [checkoutAmount, setCheckoutAmount] = useState(0)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  function authHeaders(json = false) {
    return {
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
    }
  }

  function handleLogin(accessToken, userEmail) {
    localStorage.setItem('stylehub_token', accessToken)
    localStorage.setItem('stylehub_email', userEmail)

    setToken(accessToken)
    setEmail(userEmail)
    setCartMessage('')
  }

  function handleLogout() {
    localStorage.removeItem('stylehub_token')
    localStorage.removeItem('stylehub_email')

    setToken('')
    setEmail('')
    setCartItems([])
    setCartTotal({ total_items: 0, total_price: 0 })
    setCheckoutOrderId(null)
    setCheckoutAmount(0)
    setShowCart(false)
    setCartMessage('')
  }

  useEffect(() => {
    let active = true

    async function fetchProducts() {
      try {
        const response = await fetch(`${API_URL}/products/`)

        if (!response.ok) {
          throw new Error('Unable to load products.')
        }

        const data = await response.json()

        if (active) {
          setApiProducts(data)
          setApiError('')
        }
      } catch (error) {
        console.error('Product loading error:', error)

        if (active) {
          setApiError(
            'Could not connect to the backend. Showing sample products.'
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchProducts()

    return () => {
      active = false
    }
  }, [])

  const loadCart = useCallback(async () => {
    if (!token) {
      setCartItems([])
      setCartTotal({ total_items: 0, total_price: 0 })
      return
    }

    setCartLoading(true)

    try {
      const [itemsResponse, totalResponse] = await Promise.all([
        fetch(`${API_URL}/cart/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/cart/total`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (
        itemsResponse.status === 401 ||
        totalResponse.status === 401
      ) {
        handleLogout()
        setCartMessage('Your session has expired. Please log in again.')
        return
      }

      const items = await itemsResponse.json().catch(() => [])
      const total = await totalResponse.json().catch(() => ({}))

      if (!itemsResponse.ok || !totalResponse.ok) {
        throw new Error(
          items.detail ||
            total.detail ||
            'Unable to load shopping bag.'
        )
      }

      setCartItems(items)
      setCartTotal(total)
    } catch (error) {
      console.error('Cart loading error:', error)
      setCartMessage(error.message || 'Unable to load your shopping bag.')
    } finally {
      setCartLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      loadCart()
    } else {
      setCartItems([])
      setCartTotal({ total_items: 0, total_price: 0 })
    }
  }, [token, loadCart])

  const products = useMemo(() => {
    if (apiProducts.length === 0) return fallbackProducts

    return apiProducts.map((product) => ({
      ...product,
      category: product.category || 'Fashion',
      image:
        product.image_url ||
        fallbackProducts.find((item) => item.id === product.id)?.image ||
        fallbackProducts[0].image,
      tag: '',
    }))
  }, [apiProducts])

  const categories = useMemo(
    () => [
      'All',
      ...new Set(products.map((product) => product.category)),
    ],
    [products]
  )

  const filteredProducts = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return products.filter((product) => {
      const searchableText = [
        product.name,
        product.description || '',
        product.category,
      ]
        .join(' ')
        .toLowerCase()

      const matchesSearch = searchableText.includes(search)
      const matchesCategory =
        selectedCategory === 'All' ||
        product.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [products, searchTerm, selectedCategory])

  function getProduct(productId) {
    return (
      products.find((product) => product.id === productId) ||
      fallbackProducts.find((product) => product.id === productId) || {
        id: productId,
        name: `Product #${productId}`,
        price: 0,
        image: fallbackProducts[0].image,
      }
    )
  }

  async function addToCart(productId) {
    if (!token) {
      setCartMessage('Please log in to add products to your bag.')
      return
    }

    setAddingProductId(productId)
    setCartMessage('')

    try {
      const response = await fetch(`${API_URL}/cart/`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({
          product_id: productId,
          quantity: 1,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.status === 401) {
        handleLogout()
        throw new Error('Please log in again.')
      }

      if (!response.ok) {
        throw new Error(data.detail || 'Unable to add product.')
      }

      setCartMessage('Product added to your shopping bag!')
      await loadCart()
    } catch (error) {
      setCartMessage(`Could not add product: ${error.message}`)
    } finally {
      setAddingProductId(null)
    }
  }

  async function updateQuantity(item, quantity) {
    if (quantity < 1) return

    setCartMessage('')

    try {
      const response = await fetch(`${API_URL}/cart/${item.id}`, {
        method: 'PUT',
        headers: authHeaders(true),
        body: JSON.stringify({ quantity }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.status === 401) {
        handleLogout()
        throw new Error('Please log in again.')
      }

      if (!response.ok) {
        throw new Error(data.detail || 'Unable to update quantity.')
      }

      await loadCart()
    } catch (error) {
      setCartMessage(`Could not update quantity: ${error.message}`)
    }
  }

  async function removeItem(item) {
    setCartMessage('')

    try {
      const response = await fetch(`${API_URL}/cart/${item.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      const data = await response.json().catch(() => ({}))

      if (response.status === 401) {
        handleLogout()
        throw new Error('Please log in again.')
      }

      if (!response.ok) {
        throw new Error(data.detail || 'Unable to remove item.')
      }

      setCartMessage('Item removed from your shopping bag.')
      await loadCart()
    } catch (error) {
      setCartMessage(`Could not remove item: ${error.message}`)
    }
  }

  async function handleCheckout() {
    if (!token) {
      setCartMessage('Please log in to continue.')
      return
    }

    if (cartItems.length === 0) {
      setCartMessage('Your shopping bag is empty.')
      return
    }

    setCheckoutLoading(true)
    setCartMessage('')

    try {
      const response = await fetch(`${API_URL}/orders/`, {
        method: 'POST',
        headers: authHeaders(true),
      })

      const data = await response.json().catch(() => ({}))

      if (response.status === 401) {
        handleLogout()
        throw new Error('Please log in again.')
      }

      if (!response.ok) {
        throw new Error(data.detail || 'Unable to create order.')
      }

      if (!data.id) {
        throw new Error('The backend did not return an order ID.')
      }

      setCheckoutAmount(Number(data.total_amount || cartTotal.total_price))
      setCheckoutOrderId(data.id)
      await loadCart()
    } catch (error) {
      setCartMessage(`Checkout failed: ${error.message}`)
    } finally {
      setCheckoutLoading(false)
    }
  }

  function goHome() {
    setCheckoutOrderId(null)
    setShowCart(false)
    setCartMessage('')
  }

  function goShop() {
    setCheckoutOrderId(null)
    setShowCart(false)

    setTimeout(() => {
      document.getElementById('products')?.scrollIntoView({
        behavior: 'smooth',
      })
    }, 0)
  }

  if (!token) {
    return (
      <div className="store">
        <div className="announcement">
          FREE SHIPPING ON ORDERS ABOVE ₹999
        </div>

        <header className="navbar">
          <a className="brand" href="#home">
            STYLEHUB<span>.</span>
          </a>
          <span>Everyday style, made simple.</span>
        </header>

        <Auth onLogin={handleLogin} />

        <footer className="footer">
          <a className="brand" href="#home">
            STYLEHUB<span>.</span>
          </a>
          <p>Everyday style, made simple.</p>
          <span>© 2026 StyleHub</span>
        </footer>
      </div>
    )
  }

  return (
    <div className="store">
      <div className="announcement">
        FREE SHIPPING ON ORDERS ABOVE ₹999
      </div>

      <header className="navbar">
        <a className="brand" href="#home" onClick={goHome}>
          STYLEHUB<span>.</span>
        </a>

        <nav>
          <a href="#home" onClick={goHome}>Home</a>
          <a href="#products" onClick={goShop}>Shop</a>
          <a href="#about" onClick={goHome}>About</a>
        </nav>

        <div className="navbar-actions">
          <button
            className="cart-link"
            type="button"
            onClick={() => {
              setCheckoutOrderId(null)
              setShowCart(true)
              loadCart()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            Shopping Bag ({cartTotal.total_items}) <span>↗</span>
          </button>

          <button
            className="logout-button"
            type="button"
            onClick={handleLogout}
            title={`Logged in as ${email}`}
          >
            Log out
          </button>
        </div>
      </header>

      <main>
        {checkoutOrderId !== null ? (
          <Checkout
            orderId={checkoutOrderId}
            amount={checkoutAmount}
            token={token}
            onBack={() => {
              setCheckoutOrderId(null)
              setShowCart(true)
              loadCart()
            }}
          />
        ) : !showCart ? (
          <>
            <section className="hero-section" id="home">
              <div className="hero-copy">
                <p className="eyebrow">THE NEW EVERYDAY COLLECTION</p>

                <h1>
                  Wear your<br /> own <em>story.</em>
                </h1>

                <p className="hero-description">
                  Thoughtful essentials. Timeless style. Discover pieces
                  that make every day feel a little more you.
                </p>

                <button
                  className="primary-button"
                  type="button"
                  onClick={goShop}
                >
                  Explore collection <span>↗</span>
                </button>

                <div className="hero-note">
                  <span>✳</span> Made for your everyday
                </div>
              </div>

              <div className="hero-image">
                <img
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85"
                  alt="Fashion models wearing modern everyday outfits"
                />

                <div className="image-caption">
                  <span>STYLE THAT SPEAKS</span>
                  <span>01 / 04</span>
                </div>
              </div>
            </section>

            <section className="benefits">
              <span>✳ Carefully selected styles</span>
              <span>✳ Easy everyday fashion</span>
              <span>✳ Secure checkout</span>
            </section>

            <section className="products-section" id="products">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">CURATED FOR YOU</p>
                  <h2>
                    Shop the <em>edit.</em>
                  </h2>
                </div>
                <p>{products.length} styles to discover.</p>
              </div>

              {loading && (
                <p className="api-message">Loading products...</p>
              )}

              {apiError && (
                <p className="api-message">{apiError}</p>
              )}

              {cartMessage && (
                <p className="api-message" role="status">
                  {cartMessage}
                </p>
              )}

              <div className="shop-controls">
                <input
                  type="search"
                  placeholder="Search your next favourite..."
                  aria-label="Search products"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />

                <div className="category-filters">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={
                        selectedCategory === category
                          ? 'category-filter active'
                          : 'category-filter'
                      }
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <article className="product-card" key={product.id}>
                    <div className="product-image">
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                      />

                      {product.tag && (
                        <span className="product-tag">
                          {product.tag}
                        </span>
                      )}

                      <button
                        className="quick-add"
                        type="button"
                        disabled={
                          loading ||
                          apiProducts.length === 0 ||
                          addingProductId !== null
                        }
                        onClick={() => addToCart(product.id)}
                      >
                        {addingProductId === product.id
                          ? 'Adding...'
                          : '+ Quick add'}
                      </button>
                    </div>

                    <div className="product-info">
                      <div>
                        <h3>{product.name}</h3>
                        <p>{product.category}</p>
                      </div>

                      <strong>{formatPrice(product.price)}</strong>
                    </div>
                  </article>
                ))}
              </div>

              {!loading && filteredProducts.length === 0 && (
                <p className="api-message">
                  No products found. Try another search or category.
                </p>
              )}
            </section>

            <section className="about-section" id="about">
              <p className="eyebrow">LESS, BUT BETTER</p>
              <h2>
                Good style.<br />
                <em>No complications.</em>
              </h2>
              <p>
                StyleHub brings your everyday favourites together in one
                place. Find your fit, choose your style, and make it yours.
              </p>
              <button
                type="button"
                className="primary-button"
                onClick={goShop}
              >
                Find your favourites <span>↗</span>
              </button>
            </section>
          </>
        ) : (
          <section className="products-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">YOUR SELECTION</p>
                <h2>
                  Shopping <em>bag.</em>
                </h2>
              </div>

              <button
                className="primary-button"
                type="button"
                onClick={() => setShowCart(false)}
              >
                Continue shopping
              </button>
            </div>

            {cartMessage && (
              <p className="api-message" role="status">
                {cartMessage}
              </p>
            )}

            {cartLoading ? (
              <p className="api-message">Loading your shopping bag...</p>
            ) : cartItems.length === 0 ? (
              <p className="api-message">
                Your shopping bag is empty.
              </p>
            ) : (
              <>
                <div className="cart-items">
                  {cartItems.map((item) => {
                    const product = getProduct(item.product_id)

                    return (
                      <article className="cart-item" key={item.id}>
                        <img src={product.image} alt={product.name} />

                        <div className="cart-item-details">
                          <h3>{product.name}</h3>
                          <p>{formatPrice(product.price)} each</p>

                          <div className="quantity-controls">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              disabled={item.quantity <= 1}
                              onClick={() =>
                                updateQuantity(item, item.quantity - 1)
                              }
                            >
                              −
                            </button>

                            <span>{item.quantity}</span>

                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() =>
                                updateQuantity(item, item.quantity + 1)
                              }
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="cart-item-price">
                          <strong>
                            {formatPrice(
                              Number(product.price) * item.quantity
                            )}
                          </strong>

                          <button
                            type="button"
                            className="remove-item"
                            onClick={() => removeItem(item)}
                          >
                            Remove
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>

                <div className="cart-summary">
                  <p>
                    <span>Total items</span>
                    <strong>{cartTotal.total_items}</strong>
                  </p>

                  <p>
                    <span>Subtotal</span>
                    <strong>{formatPrice(cartTotal.total_price)}</strong>
                  </p>

                  <p className="shipping-note">
                    Shipping and payment will be handled at checkout.
                  </p>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleCheckout}
                    disabled={
                      cartItems.length === 0 || checkoutLoading
                    }
                  >
                    {checkoutLoading
                      ? 'Creating order...'
                      : 'Proceed to Checkout →'}
                  </button>
                </div>
              </>
            )}
          </section>
        )}
      </main>

      <footer className="footer">
        <a className="brand" href="#home" onClick={goHome}>
          STYLEHUB<span>.</span>
        </a>
        <p>Everyday style, made simple.</p>
        <span>© 2026 StyleHub</span>
      </footer>
    </div>
  )
}

export default App
