<section class="registration-form hidden">

    <div class="registration-form__auth-type">
        <div class="auth-type__name auth-type__name-l" data-active data-auth-type="sign-in">
            <span>Sign in</span>
        </div><!--

     --><div class="auth-type__name auth-type__name-r" data-auth-type="new-account">
            <span>New account</span>
        </div>
    </div>

    <form class="registration-form__form-fields" data-auth-type="sign-in">
        <div class="form-fields__field">
            <img src="assets/icons/reg-mail.svg" class="field__icon"><!--
         --><input class="field__input" placeholder="E-mail" type="text" name="mail" value="">
        </div>

        <div class="form-fields__field field-password">
            <img src="assets/icons/key.svg" class="field__icon"><!--
         --><input class="field__input field__input-pwd" placeholder="Password" type="password" name="pwd" value=""><!--
         --><button class="field__hide-btn" type="button">Show</button>
        </div>

        <div class="form-fields__remember" onmousedown="return false; // prevent selecting">
            <label><input class="remember__checkbox" type="checkbox" name="remember"> Remember me</label>
        </div>

        <div class="form-fields__submit-btn">
            <input class="submit-btn__input" type="submit" value="Login">
        </div>
    </form>

    <div class="registration-form__hide-form-btn"><img src="<?= ICONS ?>close.svg" alt=""></div>

</section>