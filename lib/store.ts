import { configureStore } from "@reduxjs/toolkit"
import pollsReducer from "./features/polls/pollsSlice"
import authReducer from "./features/auth/authSlice"

export const makeStore = () => {
  return configureStore({
    reducer: {
      polls: pollsReducer,
      auth: authReducer,
    },
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]
