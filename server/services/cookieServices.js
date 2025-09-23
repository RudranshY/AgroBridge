// server/services/cookieServices.js (recommended name)
const setCookie = (res, name, value, opts = {}) => {
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  const defaultOpts = {
    maxAge: sevenDays,
    httpOnly: true, 
    sameSite: "none", 
    secure: process.env.NODE_ENV === "production", 
    ...opts,
  };

  console.log("Setting cookie", name, { maskedValue: value ? String(value).slice(0,6)+'...' : value, opts: defaultOpts });

  res.cookie(name, value, defaultOpts);
};

module.exports = {
  setCookie,
};
