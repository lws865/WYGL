import sqlite3
import hashlib
import secrets
from functools import wraps
from flask import Flask, request, jsonify, session, redirect, url_for, render_template, g

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)
DATABASE = 'flask_admin.db'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            email TEXT,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        hashed_pw = hashlib.sha256('admin123'.encode()).hexdigest()
        cursor.execute("INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)",
                      ('admin', hashed_pw, 'admin@example.com', 'admin'))
        print('默认管理员账户: admin / admin123')
    conn.commit()
    conn.close()

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, hashed):
    return hashlib.sha256(password.encode()).hexdigest() == hashed

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.is_json:
                return jsonify({'error': '未登录'}), 401
            return redirect(url_for('login_page'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login_page'))

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json() if request.is_json else request.form
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': '请提供用户名和密码'}), 400

    db = get_db()
    user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()

    if user and verify_password(password, user['password']):
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['role'] = user['role']
        return jsonify({'message': '登录成功', 'username': user['username'], 'role': user['role']})

    return jsonify({'error': '用户名或密码错误'}), 401

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': '已退出登录'})

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json() if request.is_json else request.form
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')

    if not username or not password:
        return jsonify({'error': '用户名和密码不能为空'}), 400

    db = get_db()
    try:
        db.execute('INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
                  (username, hash_password(password), email))
        db.commit()
        return jsonify({'message': '注册成功'})
    except sqlite3.IntegrityError:
        return jsonify({'error': '用户名已存在'}), 400

@app.route('/api/users', methods=['GET'])
@login_required
def get_users():
    db = get_db()
    users = db.execute('SELECT id, username, email, role, created_at FROM users').fetchall()
    return jsonify([dict(row) for row in users])

@app.route('/api/users/<int:user_id>', methods=['GET'])
@login_required
def get_user(user_id):
    db = get_db()
    user = db.execute('SELECT id, username, email, role, created_at FROM users WHERE id = ?', (user_id,)).fetchone()
    if user:
        return jsonify(dict(user))
    return jsonify({'error': '用户不存在'}), 404

@app.route('/api/users', methods=['POST'])
@login_required
def create_user():
    if session.get('role') != 'admin':
        return jsonify({'error': '需要管理员权限'}), 403

    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    role = data.get('role', 'user')

    if not username or not password:
        return jsonify({'error': '用户名和密码不能为空'}), 400

    db = get_db()
    try:
        db.execute('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
                  (username, hash_password(password), email, role))
        db.commit()
        return jsonify({'message': '用户创建成功'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': '用户名已存在'}), 400

@app.route('/api/users/<int:user_id>', methods=['PUT'])
@login_required
def update_user(user_id):
    if session.get('role') != 'admin' and session.get('user_id') != user_id:
        return jsonify({'error': '权限不足'}), 403

    data = request.get_json()
    db = get_db()

    if session.get('role') != 'admin':
        db.execute('UPDATE users SET email = ? WHERE id = ?',
                  (data.get('email'), user_id))
    else:
        updates = []
        params = []
        if 'username' in data:
            updates.append('username = ?')
            params.append(data['username'])
        if 'password' in data:
            updates.append('password = ?')
            params.append(hash_password(data['password']))
        if 'email' in data:
            updates.append('email = ?')
            params.append(data['email'])
        if 'role' in data:
            updates.append('role = ?')
            params.append(data['role'])
        if updates:
            params.append(user_id)
            db.execute(f'UPDATE users SET {", ".join(updates)} WHERE id = ?', params)

    db.commit()
    return jsonify({'message': '用户更新成功'})

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@login_required
def delete_user(user_id):
    if session.get('role') != 'admin':
        return jsonify({'error': '需要管理员权限'}), 403

    if session.get('user_id') == user_id:
        return jsonify({'error': '不能删除自己'}), 400

    db = get_db()
    db.execute('DELETE FROM users WHERE id = ?', (user_id,))
    db.commit()
    return jsonify({'message': '用户删除成功'})

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/users')
@login_required
def users_page():
    if session.get('role') != 'admin':
        return '需要管理员权限', 403
    return render_template('users.html')

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
