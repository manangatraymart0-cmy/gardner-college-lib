// auth.js
//
// Shared page guard. Every protected page does:
//
//   <script type="module">
//       import { protectPage } from "./auth.js";
//       protectPage(false);   // or true for admin-only pages
//   </script>
//
// protectPage() checks the real Firebase login session (works on
// any device, since it's checked against Firebase's servers, not
// something saved in this browser only), loads that account's
// profile from Firestore, fills in the sidebar profile badge, and
// shows/hides anything with class "admin-only".

import { auth, db } from "./firebase-init.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

function initials(name) {

    var parts =
        name.trim().split(/\s+/);

    var first =
        parts[0] ? parts[0][0] : "";

    var last =
        parts.length > 1 ? parts[parts.length - 1][0] : "";

    return (first + last).toUpperCase();

}


export function protectPage(adminOnly) {

    return new Promise(function (resolve) {

        onAuthStateChanged(auth, async function (user) {

            /* Not logged in on this device -> back to the login page */

            if (!user) {

                window.location.href = "index.html";

                return;

            }


            var profileSnap =
                await getDoc(doc(db, "users", user.uid));

            if (!profileSnap.exists()) {

                window.location.href = "index.html";

                return;

            }


            var profile =
                profileSnap.data();

            profile.uid = user.uid;


            /* Page is admin-only but this account isn't an admin */

            if (adminOnly && profile.role !== "admin") {

                window.location.href = "dashboard.html";

                return;

            }


            window.currentUser = profile;


            var nameEl =
                document.querySelector(".profile strong");

            var roleEl =
                document.querySelector(".profile p");

            var pictureEl =
                document.querySelector(".profile-picture");


            if (nameEl) {

                nameEl.textContent =
                    profile.fullname || profile.username;

            }

            if (roleEl) {

                roleEl.textContent =
                    profile.role === "admin" ? "Admin" : "Student";

            }

            if (pictureEl) {

                pictureEl.textContent =
                    initials(profile.fullname || profile.username);

            }


            var adminLinks =
                document.querySelectorAll(".admin-only");

            for (var i = 0; i < adminLinks.length; i++) {

                adminLinks[i].style.display =
                    profile.role === "admin" ? "" : "none";

            }


            resolve(profile);

        });

    });

}


/* LOG OUT */

window.logout = function () {

    signOut(auth).then(function () {

        window.location.href = "index.html";

    });

};
