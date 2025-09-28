import { create } from "zustand";

type CounterStore = {
  currentCloud: any[];
  setCurrentCloud: (current_cloud: any[]) => void;
  currentCloudName: string;
  setCurrentCloudName: (current_cloud_name: string) => void;
  user: object;
  setUser: (user_data: object) => void;
};

type User = {
  name: string,
  email: string,
  profile_pic: string,
  uid: string
}

export const useCounterStore = create<CounterStore>((set) => ({
  currentCloud: [],
  setCurrentCloud: (current_cloud) => {
    console.log("🏪 [Store] setCurrentCloud called with:", current_cloud);
    set({ currentCloud: current_cloud });
  },
  currentCloudName: "",
  setCurrentCloudName: (current_cloud_name) => {
    console.log("🏪 [Store] setCurrentCloudName called with:", current_cloud_name);
    set({ currentCloudName: current_cloud_name });
  },
  user: {},
  setUser: (user_data) => set({ user: user_data }),
}));