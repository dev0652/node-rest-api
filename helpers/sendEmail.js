import nodemailer from 'nodemailer';
import 'dotenv/config';

// #########################################################

const { FROM_EMAIL, FROM_PASS } = process.env;

const nodemailerConfig = {
  host: 'smtp.ukr.net',
  port: '465',
  secure: true,
  auth: {
    user: FROM_EMAIL,
    pass: FROM_PASS,
  },
};

const transport = nodemailer.createTransport(nodemailerConfig);

const sendEmail = (data) => {
  const email = { from: FROM_EMAIL, ...data };
  return transport.sendMail(email);
};

// const email = {
//   from: FROM_EMAIL,
//   to: 'm.dyuzhenko@gmail.com',
//   subject: 'China will be  a great country',
//   html: 'A <em>very</em> important email',
// };

// transport
//   .sendMail(email)
//   .then()
//   .catch((error) => console.log(error.message));

export default sendEmail;
