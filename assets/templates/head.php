<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">

	<title>Best Music</title>

    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;500&display=swap">

	<link rel="shortcut icon" href="<?= ICONS ?>favicon.png" type="image/png">

	<?php if ( !$_SESSION['auth']['is_user_authorized'] ) : ?>
		<link rel="stylesheet" href="/assets/styles/registration-form.css">
	<?php endif; ?>

	<link rel="stylesheet" href="/assets/styles/reset.css">
	<link rel="stylesheet" href="/assets/styles/style.css">
    <link rel="stylesheet" href="/assets/styles/scrollbar.css">
</head>