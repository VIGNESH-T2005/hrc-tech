export function mediaUrl(url) {
  if (!url) return null;

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const apiRoot = (import.meta.env.VITE_API_URL || window.location.origin)
    .replace(/\/+$/, '');

  return `${apiRoot}${url.startsWith('/') ? url : `/${url}`}`;
}