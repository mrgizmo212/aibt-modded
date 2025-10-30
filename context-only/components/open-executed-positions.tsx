"use client"

import type { OpenOrder, Transaction } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card" // CardTitle might not be used directly here anymore
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { ListChecks, ListX, History } from "lucide-react"
import { format } from "date-fns"

interface OpenExecutedPositionsProps {
  openOrders: OpenOrder[]
  executedTransactions: Transaction[]
  onCancelOrder: (orderId: string) => void
  currentStockTicker: string | null
}

export function OpenExecutedPositions({
  openOrders,
  executedTransactions,
  onCancelOrder,
  currentStockTicker,
}: OpenExecutedPositionsProps) {
  const filteredOpenOrders = currentStockTicker
    ? openOrders.filter((order) => order.ticker === currentStockTicker)
    : openOrders

  return (
    <Card className="mb-6">
      <Tabs defaultValue="open-orders">
        <CardHeader className="p-0 border-b">
          <TabsList className="grid w-full grid-cols-2 rounded-none">
            <TabsTrigger value="open-orders" className="rounded-tl-md">
              <ListChecks className="mr-2 h-4 w-4" />
              Open Orders ({filteredOpenOrders.length})
            </TabsTrigger>
            <TabsTrigger value="executed-orders" className="rounded-tr-md">
              <History className="mr-2 h-4 w-4" />
              Executed Orders ({executedTransactions.length})
            </TabsTrigger>
          </TabsList>
        </CardHeader>
        <TabsContent value="open-orders">
          <CardContent className="p-6">
            {/* Removed CardTitle from here */}
            <ScrollArea className="max-h-[200px]">
              {filteredOpenOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {" "}
                  {/* Adjusted padding */}
                  No open orders{currentStockTicker ? ` for ${currentStockTicker}` : ""}.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticker</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Target Price</TableHead>
                      <TableHead className="text-right">Placed</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOpenOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.ticker}</TableCell>
                        <TableCell>
                          <Badge
                            variant={order.type === "BUY" ? "default" : "destructive"}
                            className={
                              order.type === "BUY" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                            }
                          >
                            {order.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{order.orderType}</TableCell>
                        <TableCell className="text-right">{order.quantity}</TableCell>
                        <TableCell className="text-right">${order.targetPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-xs">
                          {format(new Date(order.timestamp), "HH:mm:ss")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => onCancelOrder(order.id)}
                            className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                          >
                            <ListX className="mr-1 h-3 w-3" /> Cancel
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </CardContent>
        </TabsContent>
        <TabsContent value="executed-orders">
          <CardContent className="p-6">
            {/* Removed CardTitle from here */}
            <ScrollArea className="max-h-[200px]">
              {executedTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {" "}
                  {/* Adjusted padding */}
                  No executed orders yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Ticker</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executedTransactions
                      .slice()
                      .reverse()
                      .map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="text-xs">{format(new Date(t.timestamp), "MMM d, HH:mm:ss")}</TableCell>
                          <TableCell>
                            <Badge
                              variant={t.type === "BUY" ? "default" : "destructive"}
                              className={
                                t.type === "BUY" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                              }
                            >
                              {t.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{t.ticker}</TableCell>
                          <TableCell className="text-right">{t.quantity}</TableCell>
                          <TableCell className="text-right">${t.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${t.totalValue.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
