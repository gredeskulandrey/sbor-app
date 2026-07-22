export function friendlyAuthError(message) {
  if (!message) return 'Не получилось отправить код';
  if (/security purposes|only request this after|rate limit|too many/i.test(message)) {
    return 'Слишком много попыток запроса кода, попробуйте через 30 секунд';
  }
  return 'Не получилось отправить код: ' + message;
}
