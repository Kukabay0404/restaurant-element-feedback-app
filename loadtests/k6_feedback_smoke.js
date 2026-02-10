import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 20,
  duration: "1m",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://127.0.0.1:8000";

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function () {
  const payload = JSON.stringify({
    type: "review",
    rating: randomInt(1, 10),
    text: `k6 smoke message ${Date.now()}-${__VU}-${__ITER}`,
    name: `k6-user-${__VU}`,
    contact: `@k6-${__VU}`,
  });

  const createRes = http.post(`${BASE_URL}/api/v1/feedback/create`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  check(createRes, {
    "create status is 201": (r) => r.status === 201,
  });

  const listRes = http.get(`${BASE_URL}/api/v1/feedback/`);
  check(listRes, {
    "public list status is 200": (r) => r.status === 200,
  });

  sleep(1);
}
