import { Fragment, useCallback, useEffect, useRef, useMemo } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const selectedEmployeeRef = useRef<Employee | null>(EMPTY_EMPLOYEE)

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const loadAllTransactions = useCallback(async () => {
    transactionsByEmployeeUtils.invalidateData()

    await employeeUtils.fetchAll()
    await paginatedTransactionsUtils.fetchAll()

  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  const refetchTransactions = useCallback(async () => {
  const currentEmployee = selectedEmployeeRef.current

  if (currentEmployee === null || currentEmployee.id === "") {
    await paginatedTransactionsUtils.fetchAll()
  } else {
    await transactionsByEmployeeUtils.fetchById(currentEmployee.id)
  }
  }, [paginatedTransactionsUtils, transactionsByEmployeeUtils])

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          //Bug 5 fix: removed set isloading value and the initial isloading value altogether
          isLoading={employeeUtils.loading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => {
            if (item === null || item.id === "") {
            return { value: "", label: "All Employees" }
          }
          return {
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          }
          }}
          // Bug 3 fix : Instead of doing nothing when the value is null or if the id is an empty string < I load all trasactions
          onChange={async (newValue) => {
            //I'm tracking selection here
            selectedEmployeeRef.current = newValue

            if (newValue === null || newValue.id === "") {
              await loadAllTransactions()
            } 
            else {
            await loadTransactionsByEmployee(newValue.id)
            }
          }}
        />

        <div className="RampBreak--l" />
          {/* for bug 7 fix*/}
        <div className="RampGrid">
          <Transactions 
          transactions={transactions} 
          refetchTransactions={refetchTransactions} 
          />
          

          {/* Bug 6  fixed - Here the View More button is shown only if there are more transactions */}
          {paginatedTransactions !== null &&
            paginatedTransactions.nextPage !== null && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await loadAllTransactions()
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
