import { useState } from "react";
import { LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./AuthModal";


export default function UserMenu(){

    const {user, logout} = useAuth();

    const [open,setOpen] = useState(false);

    const [authOpen,setAuthOpen] = useState(false);

    const displayName = user?.user_metadata?.full_name || user?.email;


    if(!user){
        return (

            <div className="border-t border-white/10 p-3">

                <button
                    onClick={()=>setAuthOpen(true)}
                    className="
                    w-full
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    p-3
                    hover:bg-white/5
                    transition
                    "
                >

                    <div
                    className="
                    h-9
                    w-9
                    rounded-full
                    bg-zinc-700
                    flex
                    items-center
                    justify-center
                    text-white
                    "
                    >
                        <LogIn size={16} />
                    </div>


                    <div className="text-left">

                        <p className="
                        text-sm
                        text-white
                        ">
                            Log in
                        </p>

                        <p className="
                        text-xs
                        text-gray-400
                        ">
                            Sign in to your account
                        </p>

                    </div>

                </button>

                <AuthModal
                    open={authOpen}
                    onClose={()=>setAuthOpen(false)}
                />

            </div>

        );
    }


    return (

        <div className="relative border-t border-white/10 p-3">


            <button
                onClick={()=>setOpen(!open)}
                className="
                w-full
                flex
                items-center
                gap-3
                rounded-xl
                p-3
                hover:bg-white/5
                transition
                "
            >

                <div
                className="
                h-9
                w-9
                rounded-full
                bg-blue-600
                flex
                items-center
                justify-center
                text-white
                font-semibold
                "
                >
                    {
                        displayName
                        ?.charAt(0)
                        .toUpperCase()
                    }
                </div>


                <div className="text-left overflow-hidden">

                    <p className="
                    text-sm
                    text-white
                    truncate
                    ">
                        {displayName}
                    </p>

                    <p className="
                    text-xs
                    text-gray-400
                    ">
                        Account
                    </p>

                </div>


            </button>



            {
            open && (

                <div
                className="
                absolute
                bottom-16
                left-3
                right-3
                rounded-xl
                border
                border-white/10
                bg-[#18181b]
                shadow-xl
                p-2
                "
                >


                    <button
                    className="
                    w-full
                    text-left
                    px-3
                    py-2
                    rounded-lg
                    text-sm
                    text-gray-300
                    hover:bg-white/10
                    "
                    >
                        Settings
                    </button>



                    <button
                    onClick={logout}
                    className="
                    w-full
                    text-left
                    px-3
                    py-2
                    rounded-lg
                    text-sm
                    text-red-400
                    hover:bg-red-500/10
                    "
                    >
                        Logout
                    </button>


                </div>

            )
            }


        </div>

    )
}