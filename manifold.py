import sqlite3
from contextlib import closing
from flask import Flask, request, sessions, g, redirect, url_for, abort, render_template, flash


# create the app
app = Flask(__name__)

# config
DATABASE = '/tmp/manifold.db'
DEBUG = True
SECRET_KEY = 'development key'
USERNAME = 'admin'
PASSWORD = 'default'

app.config.from_object(__name__)


def connect_db():
    """connect to the specified database"""
    return sqlite3.connect(app.config['DATABASE'])


def init_db():
    """initialize the database"""
    with closing(connect_db()) as db:
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()


@app.before_request
def before_request():
    """called before all requests"""
    g.db = connect_db()


@app.teardown_request
def teardown_request(exception):
    """called after all requests"""
    db = getattr(g, 'db', None)
    if db is not None:
        db.close()


#views
@app.route('/')
def home():
    return render_template("manifold.html")

@app.route('/secondDemo')
def second():
    return render_template("secondDemo.html")


# run the app
if __name__ == '__main__':
    app.run()
