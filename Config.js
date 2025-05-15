module.exports = [
  {
    name: 'Email 1',
    email: 'vishal.c@shuruwaat.com',
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
      user: 'vishal.c@shuruwaat.com',
      pass: process.env.EMAIL_PASS_1,
    },
  },
  {
    name: 'Email 2',
    email: 'vishal@shuruwaat.com',
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
      user: 'vishal@shuruwaat.com',
      pass: process.env.EMAIL_PASS_2,
    },
  },
];
