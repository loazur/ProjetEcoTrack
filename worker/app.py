import math
import os
from flask import Flask, jsonify, request
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 32768
@app.get('/health')
def health():
    return jsonify(status='ok')
@app.post('/analyze')
def analyze():
    data = request.get_json(silent=True)
    numbers = data.get('numbers') if isinstance(data, dict) else None
    if not isinstance(numbers, list) or not 1 <= len(numbers) <= 1000:
        return jsonify(error='Fournir une liste de 1 à 1000 nombres.'), 400
    if any(type(n) not in (int, float) or not math.isfinite(n) or abs(n) > 1e12 for n in numbers):
        return jsonify(error='Valeurs numériques invalides.'), 400
    return jsonify(average=sum(numbers)/len(numbers), maximum=max(numbers))
if __name__ == '__main__':
    # Serveur de développement pour ce TP local.
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT','8000')), debug=False)
