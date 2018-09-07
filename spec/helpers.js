exports.generateRandomString = (length = 10) => {
  const allowed = 'abcdefghjiklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let string = [];
  for(let i = 0 ; i < length ; i++) {
    string.push(allowed[Math.floor(Math.random() * allowed.length)]);
  }
  return string.join('');
}
