export function regexEmail(email)
{
    const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if(!regex.test(email))
    {
        //if pattern is not good, user will not be add
        return false;
    }
    return true;
}