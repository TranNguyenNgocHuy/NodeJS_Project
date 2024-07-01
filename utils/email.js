const nodemailer = require('nodemailer');

const sendEmail = async options => {
  const transpoter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
    // if use Gmail should be config 'less secure app' in account
  });

  const mailOptions = {
    from: 'Trần Huy <admin@test.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
    //html:
  };

  await transpoter.sendMail(mailOptions);
};

module.exports = sendEmail;
