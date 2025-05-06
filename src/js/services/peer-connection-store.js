let conn = null;

export function setConnection(c) {
  conn = c;
}

export function getConnection() {
  return conn;
}