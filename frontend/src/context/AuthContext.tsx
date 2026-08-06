import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import {
    Session,
    User
} from "@supabase/supabase-js";

import { supabase } from "../lib/supabase";


type AuthContextType = {

    user: User | null;

    session: Session | null;

    loading: boolean;

    logout: () => Promise<void>;

};


const AuthContext = createContext<AuthContextType | undefined>(
    undefined
);



export function AuthProvider(
    {children}: {children: React.ReactNode}
){

    const [user,setUser] = useState<User | null>(null);

    const [session,setSession] = useState<Session | null>(null);

    const [loading,setLoading] = useState(true);



    useEffect(()=>{


        // Check existing session
        supabase.auth.getSession()
        .then(({data})=>{

            setSession(data.session);

            setUser(
                data.session?.user ?? null
            );

            setLoading(false);

        });



        // Listen for login/logout changes

        const {
            data:{
                subscription
            }
        } = supabase.auth.onAuthStateChange(
            (_event,session)=>{


                setSession(session);

                setUser(
                    session?.user ?? null
                );


            }
        );


        return ()=>{

            subscription.unsubscribe();

        };


    },[]);



    async function logout(){

        await supabase.auth.signOut();

    }



    return (

        <AuthContext.Provider
            value={{
                user,
                session,
                loading,
                logout
            }}
        >

            {children}

        </AuthContext.Provider>

    );

}



export function useAuth(){

    const context = useContext(AuthContext);


    if(!context){

        throw new Error(
            "useAuth must be used inside AuthProvider"
        );

    }


    return context;

}