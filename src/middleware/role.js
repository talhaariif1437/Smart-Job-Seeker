exports.check = (role) => {
	return (req, res, next) => {
		if (req.user.role == role) {
			next()
		} else {
			return res.status(400).json({
				code: 400,
				message: 'Permission Denined!'
			});
		}
	}
}