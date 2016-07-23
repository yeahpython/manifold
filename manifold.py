from contextlib import closing
from flask import Flask, request, sessions, g, redirect, url_for, abort, render_template, flash


# create the app
app = Flask(__name__)

# config
# DATABASE = '/tmp/manifold.db'
DEBUG = True
SECRET_KEY = 'development key'
USERNAME = 'admin'
PASSWORD = 'default'

app.config.from_object(__name__)

#views
@app.route('/')
def home():
    return render_template("manifold.html")

@app.route('/jacobian')
def jacobian():
    return render_template("jacobian.html")

@app.route('/linear_transformation')
def linear_transformation():
    return render_template("linear_transformation.html")


# run the app
if __name__ == '__main__':
    app.run()
