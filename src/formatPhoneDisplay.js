export function formatPhoneDisplay(raw) {
  const digits = (raw || '').replace(/[^0-9]/g, '');
  if (digits.length < 10) return raw;
  const national = digits.slice(-10);
  const countryCode = digits.slice(0, digits.length - 10) || '7';
  const p1 = national.slice(0, 3), p2 = national.slice(3, 6), p3 = national.slice(6, 8), p4 = national.slice(8, 10);
  return `+${countryCode}(${p1})${p2}-${p3}-${p4}`;
}
