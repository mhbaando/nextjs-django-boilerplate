class StatusService:
    @staticmethod
    def check_user_status(user):
        if user.status != "active":
            return {
                "error": True,
                "message": "Isticmaalaha mahan mid shaqeynaya, Fadlan Laxariir Devlopers-ka",
            }

    @staticmethod
    def check_password_change(user):
        if not user.has_changed_password:
            return {
                "error": True,
                "change_password_required": True,
                "message": "Please change your password",
            }
