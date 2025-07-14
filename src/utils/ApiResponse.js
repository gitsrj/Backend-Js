// jab bhi response bhejenge, isise bhejege
class ApiResponse {
    constructor (statusCode, data, message = "Success") {
        this.statusCode = statusCode,
        this.data = data,
        this.message = message,
        this.success = statusCode < 400  // 400 se upar ka kuch hoga to vo error hoga, aur vo to hum apiError se bhej hi rahe hai.
    }
}

export { ApiResponse }