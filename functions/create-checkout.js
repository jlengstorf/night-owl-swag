const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const shippingCountries = require('./data/shippingCountries.json');

exports.handler = async ({ body }) => {
  const { price, quantity, size, description } = JSON.parse(body);
  const validatedQuantity = quantity > 0 ? quantity : 1;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    billing_address_collection: 'auto',
    shipping_address_collection: {
      // Unsupported country codes:
      // AS, CX, CC, CU, HM, IR, KP, MH, FM, NF, MP, PW, SD, SY, UM, VI
      // (sorry, that’s Stripe policy, not mine)
      allowed_countries: shippingCountries,
    },
    line_items: [
      {
        price,
        quantity: validatedQuantity,
        description,
      },
    ],
    metadata: {
      size,
      quantity: validatedQuantity,
    },
    success_url: `${process.env.URL}/purchased`,
    cancel_url: `${process.env.URL}/`,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      sessionId: session.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    }),
  };
};
