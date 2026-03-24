const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

export const maskGuestIp = (ip) => {
  const raw = normalizeText(ip);
  if (!raw) return '';

  if (raw.includes('.')) {
    const parts = raw.split('.');
    if (parts.length >= 2) {
      return `${parts[0]}.${parts[1]}`;
    }
    return raw;
  }

  if (raw.includes(':')) {
    const parts = raw.split(':').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return raw.slice(0, 6);
  }

  return raw;
};

export const formatWriterWithIp = (writer, ip) => {
  const name = normalizeText(writer) || '익명';
  const maskedIp = maskGuestIp(ip);
  if (!maskedIp) return name;
  return `${name}(${maskedIp})`;
};
