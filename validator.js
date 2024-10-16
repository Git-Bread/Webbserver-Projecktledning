//comprehensive input validation
export default async function validate(obj, mode, login) {
    //holds all errors for comprehensive output
    let errors = [];
    //checks for standard empty
    if (!obj.body.username) {
        errors.push("No username")
    }
    if (!obj.body.password) {
        errors.push("No password")
    }

    let logins = await login.find();

    //diffrent validation modes for login/register, more efficient with an if but this is more expandable
    switch (mode) {
        case 1: //highly unsafe and dosent bother to check email, but it works according to the specifications
            //checks if user exists
            let match = false;
            for (let index = 0; index < logins.length; index++) {
                if (obj.body.username == logins[index].username) {
                    match = true;
                }
            }
            if (!match) {
                errors.push("invalid username")
            }
            if (errors[0] != "") {
                return errors;   
            }
        
        //registration
        case 2:
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
                errors.push("No number")
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
        default:
            break;
    }
    return true
}