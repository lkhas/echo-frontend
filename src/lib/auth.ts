// src/lib/auth.ts
export const getUserDataFromToken = () => {
  const token = localStorage.getItem('access_token');
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    
    // Check this log: it must show { sub: "...", role: "admin", ... }
    console.log("Decoded Payload:", payload); 
    return payload;
  } catch (error) {
    return null;
  }
};