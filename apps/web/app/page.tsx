"use client";

import type React from "react";
import { useEffect } from "react";
import UdifyWorkflowEmbed from "../components/UdifyWorkflowEmbed";
import TailwindAdvancedEditor from "../components/tailwind/advanced-editor";
import { ThemeToggle } from "../components/theme-toggle";
import { Button } from "../components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../components/ui/drawer";

const Page: React.FC = () => {
  console.log("Page component rendering");

  useEffect(() => {
    console.log("Page component mounted");
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="grid grid-cols-3 items-center mb-8">
        <div className="col-span-1" />
        <div className="col-span-1 flex justify-center">
          <h1 className="text-4xl font-bold">寫作APP</h1>
        </div>
        <div className="col-span-1 flex justify-end items-center gap-2">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline">Generate Content</Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-screen-md">
                <DrawerHeader>
                  <DrawerTitle>AI 生成內容</DrawerTitle>
                  <DrawerDescription>在這邊透過輸入不同的文章或是想法，可以用AI在生成出相似的文章</DrawerDescription>
                </DrawerHeader>
                <UdifyWorkflowEmbed />
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
          <ThemeToggle />
        </div>
      </div>
      <div className="w-full flex justify-center">
        <div className="w-full max-w-screen-lg">
          <div className="w-full max-w-none">
            <TailwindAdvancedEditor />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
