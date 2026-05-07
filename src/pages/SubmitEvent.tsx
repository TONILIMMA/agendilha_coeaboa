 import Header from "@/components/Header";
 import SubmissionForm from "@/components/SubmissionForm";
 
 const SubmitEvent = () => {
   return (
     <div className="min-h-screen bg-background pb-12">
       <Header />
       <main className="container mx-auto px-2 sm:px-4 pt-4 sm:pt-8">
         <div className="max-w-4xl mx-auto">
           <SubmissionForm />
         </div>
       </main>
     </div>
   );
 };
 
 export default SubmitEvent;