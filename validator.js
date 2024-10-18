//comprehensive input validation
export default async function registrationValidate(obj, login) {
    //holds all errors for comprehensive output
    let errors = [];
    let logins = await login.find();

    //compares usernames to check for duplicate
    for (let index = 0; index < logins.length; index++) {
        if (obj.body.username == logins[index].username) {
            errors.push("Invalid username, that username is already in use")
        }  
    }
    //compares emails to check for duplicate
    for (let index = 0; index < logins.length; index++) {
        if (obj.body.email == logins[index].email) {
            errors.push("Invalid email, that email is already in use")
        }  
    }

    if (!obj.body.username) {
        errors.push("No username")
    }
    if (!obj.body.email) {
        errors.push("No email")
        return errors;   
    }
    //regex for email format, makes sure it is two parts and an @ aswell as an 2-4 ending such as .com
    let regex = /^[a-zA-Z0–9._-]+@[a-zA-Z0–9.-]+\.[a-zA-Z]{2,4}$/;
    let valid = regex.test(obj.body.email);
    if (!valid) {
        errors.push("Invalid email")
    }          

    //sends all the errors back
    if (errors[0] != "") {
        return errors;   
    }
    return false
}