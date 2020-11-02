"use strict";

window.playerHTML.querySelector('#login-button').addEventListener('click', function() {
	document.querySelector('.registration-form').classList.remove('hidden');

	// made to make the form modal
	document.body.insertAdjacentHTML('beforeend', '<div id="body-blur"></div>');
});

document.querySelector('.registration-form__hide-form-btn').onclick = function(e) {
	e.target.closest('.registration-form').classList.add('hidden');

	document.body.querySelector('#body-blur').remove();
}
+
// change authorization type to sign in/create new account
document.querySelector('.registration-form__auth-type').addEventListener('click', function(e) {
	let form = document.querySelector('.registration-form').querySelector('form');

	let authTypeField = e.target.closest('.auth-type__name');

	if (!authTypeField) return 0;

	let authType = authTypeField.dataset.authType;

	if (authType == form.dataset.authType) return 0;

	this.querySelector('[data-active]').removeAttribute('data-active');
	authTypeField.setAttribute('data-active', '');


	form.dataset.authType = authType;

	if (authType == 'new-account')
		form.querySelector('.submit-btn__input').value = 'Create new account';
	if (authType == 'sign-in')
		form.querySelector('.submit-btn__input').value = 'Login';

	for (let input of form) {
		if ( input.type == 'text' || input.type == 'password' ) input.value = '';
		if ( input.type == 'checkbox' ) input.checked = false;

		input.removeAttribute('data-error'); // clear all errors
	}
});

document.querySelector('.registration-form').querySelector('form').addEventListener('submit', function(e) {
	e.preventDefault(); // cancel the form submission

	let mail = this.querySelector('input[name="mail"]');
	let password = this.querySelector('input[name="pwd"]');

	let mailError = false; // for error handling. Main error handler is on the server
	let passwordError = false;

	do { // the do while hack
		if ( mail.hasAttribute('data-error') ) break; // if the user didn't fix the previous error

		mailError = true; // if the value does not change - an error occurred
		mail.setAttribute('data-error', '');

		if ( mail.value === '' ) {
			mail.value = 'Mail required';
			break;
		}

		if ( mail.value.split('@').length - 1 != 1 ) {
			mail.value = 'There must be one @ symbol';
			break;
		}

		if ( mail.value.startsWith('@') || mail.value.endsWith('@') ) {
			mail.value = 'Invalid mail';
			break;
		}

		// everything is fine, no errors
		mailError = false;
		mail.removeAttribute('data-error');
	} while(false);

	/*
	 Password validation
	*/

	do { // the do while hack
		if ( password.hasAttribute('data-error') ) break; // if the user didn't fix the previous error

		passwordError = true; // if the value does not change - an error occurred
		document.querySelector('.registration-form .field__hide-btn').innerHTML = 'Hide';
		password.setAttribute('data-error', '');

		if ( password.value === '' ) {
			password.value = 'Password required';

			break;
		}

		if ( password.value.length < 7 || password.value.length > 15 ) {
			password.value = 'Password length must be greater than 6 and less than 16';

			break;
		}

		// everything is fine, no errors
		passwordError = false;
		password.removeAttribute('data-error');
	} while(false);

	if (mailError || passwordError) {
		if (passwordError) {
			password.type = 'text';
			this.querySelector('.field__hide-btn').innerHTML = 'Hide';
		}
		return 0;
	}

	let authType = this.dataset.authType;

	let remember = this.querySelector('input[name="remember"]').checked;

	// send authorization request to server
	let auth = fetch('http://music.loc/', {
		method: 'POST',

		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},

		body: `auth_type=${authType}&mail=${mail.value}&password=${password.value}&remember=${remember}`
	});

	let authStatus = auth.then(r => r.text());

	authStatus.then(function(status) {
		if ( status === 'true' ) {
			document.querySelector('.registration-form').remove();
			window.playerHTML.querySelector('.header-log-in-button').remove();
			document.body.querySelector('#body-blur').remove();

			// this event indicates that the user is logged in
			let userAuthorizedEvent = new CustomEvent('user-authorized');
			window.dispatchEvent(userAuthorizedEvent);
		} else {
			let errorField = status.split('::')[0];

			if (errorField == 'password') {
				password.setAttribute('data-error', '');
				password.value = status.split('::')[1];
			}

			if (errorField == 'mail') {
				mail.setAttribute('data-error', '');
				mail.value = status.split('::')[1];
			}
		}
	});
});

function removeErrorMessage(e) {
	if (!e.target.name) return 0;

	if ( e.target.hasAttribute('data-error') ) {
		e.target.value = '';
		e.target.removeAttribute('data-error');
	}
}

// remove message about error if exists
document.querySelector('.registration-form__form-fields').addEventListener('focusin', function(e) {
	removeErrorMessage(e);
});

document.querySelector('.registration-form__form-fields').addEventListener('input', function(e) {
	removeErrorMessage(e);
});

// hide/show password
document.querySelector('.registration-form .field__hide-btn').onclick = function(e) {
	let passwordInput = e.target.parentNode.querySelector('input[name="pwd"]');

	if (passwordInput.type == 'text') {
		passwordInput.type = 'password';
		this.innerHTML = 'Show';
	} else {
		passwordInput.type = 'text';
		this.innerHTML = 'Hide';
	}
};