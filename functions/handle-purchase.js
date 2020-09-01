const stripe = require('stripe')(process.env.STRIPE_API_SECRET);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const mail = require('@sendgrid/mail');

mail.setApiKey(process.env.SENDGRID_API_KEY);

exports.handler = async ({ headers, body }) => {
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      headers['stripe-signature'],
      endpointSecret,
    );

    if (event.type !== 'checkout.session.completed') {
      return;
    }

    const order = event.data.object;

    const {
      line1,
      line2,
      city,
      state,
      postal_code,
      country,
    } = order.shipping.address;

    const msg = {
      to: process.env.FULFILLMENT_EMAIL_ADDRESS,
      from: 'support@learnwithjason.dev',
      subject: 'New pre-order for the Night Owl shirt',
      text: `
Items:
- ${order.metadata.quantity}x ${order.metadata.size} 

Shipping Address:
${order.shipping.name}
${line1}${line2 !== null ? '\n' + line2 : ''}
${city}, ${state} ${postal_code}
${country}
`,
    };

    // uncomment this to send an email when purchases are made
    // await mail.send(msg);

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: `WebHook error: ${error.message}`,
    };
  }
};
