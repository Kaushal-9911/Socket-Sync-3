// ================= BACKEND BASE URL =================
//const BASE_URL = "http://127.0.0.1:5000";
// later change to Render URL:
 const BASE_URL = "https://render-try-bo3o.onrender.com";


// ================= LOGIN =================
async function login(){
    if(!uid.value || !pwd.value){
        alert("Please fill in all fields");
        return;
    }

    const r = await fetch(`${BASE_URL}/login`,{
        method:"POST",
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
            userId: uid.value,
            password: pwd.value
        })
    });

    const d = await r.json();

    if(d.error){
        alert(d.error);
        return;
    }

    localStorage.setItem("currentUser", JSON.stringify(d));
    window.location.href = "chat.html";
}


// ================= SIGNUP =================
async function signup(){
    if(!suname.value || !suid.value || !spwd.value){
        alert("Please fill in all fields");
        return;
    }

    const response = await fetch(`${BASE_URL}/signup`,{
        method:"POST",
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
            name: suname.value,
            userId: suid.value,
            password: spwd.value,
            avatar: "https://ui-avatars.com/api/?name=" + encodeURIComponent(suname.value)
        })
    });

    const data = await response.json();

    if(data.error){
        alert(data.error);
        return;
    }

    alert("Signup successful! Please login.");
    window.location.href = "login.html";
}


// ================= ENTER KEY HANDLING =================
document.addEventListener('keypress', function(e){
    if(e.key === 'Enter'){
        if(document.getElementById("uid")) login();
        if(document.getElementById("suname")) signup();
    }
});
