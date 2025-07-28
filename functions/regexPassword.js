export function regexPassword(password) {
    const regex = /^(?=.*[A-Z]).{8,100}$/;
    if (!regex.test(password)) {
        //if pattern is not good, user will not be add
        return false;
    }
    return true;
}