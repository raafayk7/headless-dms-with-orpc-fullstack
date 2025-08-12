import { useLogoutMutation } from "@app/shared/hooks/auth-hooks"
import { toast } from "@app/shared/toast"
import { Button } from "@mantine/core"
import { useNavigate, useRouter } from "@tanstack/react-router"
import { LogOutIcon } from "lucide-react"
import { memo, useState } from "react"

// type LogoutBtnProps = {
//   onLogoutSuccess: () => Promise<void>
// }

const LogoutBtn = () => {
  const [loggingOut, setLoggingOut] = useState(false)
  const logoutMut = useLogoutMutation()
  const router = useRouter()
  const navigate = useNavigate()

  const onLogoutSuccess = async () => {
    await router.invalidate()

    navigate({ to: "/auth/login", replace: true })
  }

  const handleClick = async () => {
    setLoggingOut(true)

    await logoutMut.mutateAsync(undefined, {
      onError: (err) => {
        toast.error({
          title: "Logout failed",
          message: err.message,
        })
      },
      onSuccess: async (res) => {
        if (res.data?.success) {
          await onLogoutSuccess()
        }
      },
      onSettled: () => {
        setLoggingOut(false)
      },
    })
  }

  return (
    <Button
      fullWidth
      justify="start"
      loading={loggingOut}
      onClick={handleClick}
      variant="transparent"
    >
      <LogOutIcon />
      <span>Logout</span>
    </Button>
  )
}

export default memo(LogoutBtn)
