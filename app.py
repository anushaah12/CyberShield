from flask import Flask, render_template, request
from urllib.parse import urlparse
import re

app = Flask(__name__)


def check_url(url):
    score = 0
    reasons = []

    url = url.strip()

    if not url.startswith(("http://", "https://")):
        url = "http://" + url

    parsed = urlparse(url)
    domain = parsed.netloc.lower()
    clean_domain = domain.split(":")[0]

    # HTTPS CHECK
    if parsed.scheme == "http":
        score += 20
        reasons.append("Website does not use HTTPS")

    # IP ADDRESS CHECK
    ip_pattern = r"^\d{1,3}(\.\d{1,3}){3}$"

    if re.match(ip_pattern, clean_domain):
        score += 30
        reasons.append(
            "URL uses an IP address instead of a domain name"
        )

    # SUSPICIOUS KEYWORDS
    suspicious_keywords = [
        "login",
        "signin",
        "verify",
        "verification",
        "account",
        "update",
        "secure",
        "password",
        "bank",
        "payment",
        "confirm",
        "wallet",
        "credential",
        "unlock"
    ]

    found_keywords = []

    for keyword in suspicious_keywords:
        if keyword in url.lower():
            found_keywords.append(keyword)

    if found_keywords:
        score += min(len(found_keywords) * 10, 30)
        reasons.append(
            "Suspicious keywords detected: "
            + ", ".join(found_keywords)
        )

    # @ SYMBOL CHECK
    if "@" in url:
        score += 15
        reasons.append("URL contains an @ symbol")

    # MULTIPLE HYPHENS
    if clean_domain.count("-") >= 2:
        score += 10
        reasons.append("Domain contains multiple hyphens")

    # LONG URL
    if len(url) > 100:
        score += 10
        reasons.append("URL is unusually long")

    # URL SHORTENERS
    shorteners = [
        "bit.ly",
        "tinyurl.com",
        "t.co",
        "is.gd",
        "cutt.ly"
    ]

    if any(shortener in clean_domain for shortener in shorteners):
        score += 20
        reasons.append(
            "URL uses a shortened-link service"
        )

    # MAXIMUM SCORE
    score = min(score, 100)

    # RISK LEVEL
    if score >= 70:
        level = "High Risk"
    elif score >= 40:
        level = "Suspicious"
    else:
        level = "Safe"

    # NO THREATS
    if not reasons:
        reasons.append(
            "No obvious suspicious indicators detected"
        )

    return {
        "url": url,
        "score": score,
        "level": level,
        "reasons": reasons
    }


@app.route("/", methods=["GET", "POST"])
def home():
    result = None

    if request.method == "POST":
        url = request.form.get("url", "").strip()

        if url:
            result = check_url(url)

    return render_template(
        "url_checker.html",
        result=result
    )


@app.route("/url-checker", methods=["GET", "POST"])
def url_checker():
    result = None

    if request.method == "POST":
        url = request.form.get("url", "").strip()

        if url:
            result = check_url(url)

    return render_template(
        "url_checker.html",
        result=result
    )


if __name__ == "__main__":
    print("====================================")
    print("       CyberShield Starting...")
    print("====================================")
    print()
    print("Open this in your browser:")
    print("http://127.0.0.1:5000")
    print()

    app.run(
        debug=True,
        host="127.0.0.1",
        port=5000
    )