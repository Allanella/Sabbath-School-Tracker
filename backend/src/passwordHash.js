const bcrypt = require('bcrypt');

(async () => {
  const password = 'allanadmin';
  const hash = await bcrypt.hash(password, 10);
  console.log(hash);
})();
